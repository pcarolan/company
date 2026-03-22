"""Orchestrator — dispatches plan tasks to agents and drives execution.

When you hit "run", the orchestrator:
1. Finds all unassigned open tasks in the project
2. Matches tasks to idle agents by role/scope
3. Claims tasks for agents, sets them to working
4. Simulates the agent loop (plan → modify → verify → commit)
5. Broadcasts every state change via WebSocket so the canvas updates live
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .state import CompanyState
    from ..models.project import Project

from ..models import AgentStatus, TaskStatus, EventType


class Orchestrator:
    """Drives project execution — dispatches tasks to agents."""

    def __init__(self, state: "CompanyState") -> None:
        self.state = state
        self._running: dict[str, asyncio.Task] = {}  # project_id -> task

    def is_running(self, project_id: str) -> bool:
        task = self._running.get(project_id)
        return task is not None and not task.done()

    async def run_project(self, project_id: str) -> None:
        """Start executing a project. Dispatches work to agents."""
        if self.is_running(project_id):
            return

        project = self.state.projects.get(project_id)
        if not project:
            return

        task = asyncio.create_task(self._execute_project(project_id))
        self._running[project_id] = task

    async def stop_project(self, project_id: str) -> None:
        """Stop a running project."""
        task = self._running.get(project_id)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self._running.pop(project_id, None)

        # set all working agents back to idle
        project = self.state.projects.get(project_id)
        if project:
            from ..models import ProjectStatus
            project.status = ProjectStatus.PAUSED
            project.updated_at = datetime.now(timezone.utc)
            for aid in project.agent_ids:
                agent = self.state.agents.get(aid)
                if agent and agent.status == AgentStatus.WORKING:
                    agent.status = AgentStatus.IDLE
                    agent.thinking = None
            await self.state.broadcast_canvas()

    async def _execute_project(self, project_id: str) -> None:
        """Main execution loop for a project."""
        from ..models import ProjectStatus

        project = self.state.projects.get(project_id)
        if not project:
            return

        # set project active
        project.status = ProjectStatus.ACTIVE
        project.updated_at = datetime.now(timezone.utc)
        self.state._emit(EventType.GATE_PASS, "", message=f"▶ Project '{project.name}' started")
        await self.state.broadcast_canvas()

        try:
            while True:
                # find open tasks
                open_tasks = [
                    self.state.tasks[tid]
                    for tid in project.task_ids
                    if tid in self.state.tasks
                    and self.state.tasks[tid].status == TaskStatus.OPEN
                ]

                if not open_tasks:
                    # check if all done
                    all_tasks = [
                        self.state.tasks[tid]
                        for tid in project.task_ids
                        if tid in self.state.tasks
                    ]
                    in_progress = [t for t in all_tasks if t.status == TaskStatus.CLAIMED]
                    if not in_progress:
                        # all done!
                        break
                    # wait for in-progress tasks
                    await asyncio.sleep(1)
                    continue

                # find idle agents
                idle_agents = [
                    self.state.agents[aid]
                    for aid in project.agent_ids
                    if aid in self.state.agents
                    and self.state.agents[aid].status == AgentStatus.IDLE
                ]

                # dispatch: assign open tasks to idle agents
                for agent in idle_agents:
                    if not open_tasks:
                        break

                    task = open_tasks.pop(0)
                    # claim the task
                    self.state.claim_task(task.id, agent.id)
                    await self.state.broadcast_canvas()

                    # run the agent's work loop in background
                    asyncio.create_task(
                        self._agent_work_loop(project_id, agent.id, task.id)
                    )

                await asyncio.sleep(0.5)

        except asyncio.CancelledError:
            raise
        finally:
            # mark project complete if all tasks done
            project = self.state.projects.get(project_id)
            if project:
                all_tasks = [
                    self.state.tasks[tid]
                    for tid in project.task_ids
                    if tid in self.state.tasks
                ]
                all_done = all(t.status == TaskStatus.DONE for t in all_tasks) if all_tasks else False
                if all_done:
                    project.status = ProjectStatus.COMPLETED
                    self.state._emit(EventType.GATE_PASS, "", message=f"✓ Project '{project.name}' completed!")
                project.updated_at = datetime.now(timezone.utc)
                await self.state.broadcast_canvas()

            self._running.pop(project_id, None)

    async def _agent_work_loop(self, project_id: str, agent_id: str, task_id: str) -> None:
        """Simulate an agent working on a task.

        In the future this will spawn a real OpenClaw session.
        For now it simulates the autonomous-dev loop with realistic timing
        so the canvas visualization works.
        """
        agent = self.state.agents.get(agent_id)
        task = self.state.tasks.get(task_id)
        project = self.state.projects.get(project_id)
        if not agent or not task or not project:
            return

        try:
            # phase 1: reading codebase
            agent.thinking = f"reading codebase for '{task.title}'"
            await self.state.broadcast_canvas()
            await asyncio.sleep(random.uniform(1.5, 3.0))

            # phase 2: planning
            agent.thinking = f"planning approach for '{task.title}'"
            await self.state.broadcast_canvas()
            await asyncio.sleep(random.uniform(1.0, 2.0))

            # phase 3: implementation iterations
            iterations = random.randint(2, 5)
            for i in range(iterations):
                # modify
                agent.thinking = f"implementing ({i+1}/{iterations})"
                await self.state.broadcast_canvas()
                await asyncio.sleep(random.uniform(1.5, 3.0))

                # verify (gates)
                agent.thinking = "running gates..."
                await self.state.broadcast_canvas()
                await asyncio.sleep(random.uniform(0.5, 1.5))

                # sometimes fail and revert
                if random.random() < 0.2 and i < iterations - 1:
                    agent.thinking = "gate failed — reverting"
                    self.state.record_revert(agent_id, f"gate failed on iteration {i+1}")
                    await self.state.broadcast_canvas()
                    await asyncio.sleep(random.uniform(0.5, 1.0))
                    continue

                # commit
                sha = f"{random.randint(0, 0xffffff):06x}"
                self.state.record_commit(
                    agent_id, sha,
                    f"feat({task.title[:20]}): iteration {i+1}"
                )
                await self.state.broadcast_canvas()
                await asyncio.sleep(random.uniform(0.3, 0.8))

            # phase 4: review
            agent.thinking = "reviewing changes"
            await self.state.broadcast_canvas()
            await asyncio.sleep(random.uniform(0.5, 1.5))

            # maybe message the architect
            for aid in project.agent_ids:
                other = self.state.agents.get(aid)
                if other and other.role.value == "architect" and other.id != agent_id:
                    self.state.send_message(
                        agent_id, other.id,
                        f"completed '{task.title}' — ready for review"
                    )
                    await self.state.broadcast_canvas()
                    break

            # phase 5: push
            agent.status = AgentStatus.PUSHING
            agent.thinking = "pushing to remote"
            await self.state.broadcast_canvas()
            await asyncio.sleep(random.uniform(0.5, 1.0))

            # done — close task
            self.state.close_task(task_id, f"Completed by {agent.name}")
            agent.thinking = None
            agent.status = AgentStatus.IDLE
            await self.state.broadcast_canvas()

        except asyncio.CancelledError:
            agent.thinking = None
            agent.status = AgentStatus.IDLE
            await self.state.broadcast_canvas()
            raise
        except Exception:
            agent.thinking = "error — going idle"
            agent.status = AgentStatus.STUCK
            await self.state.broadcast_canvas()
