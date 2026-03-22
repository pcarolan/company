"""Orchestrator — dispatches plan tasks to agents and drives execution.

When you hit "run" on a plan, the orchestrator:
1. Generates tasks from the plan if none exist
2. Finds open tasks belonging to this plan
3. Matches tasks to idle agents in the project
4. Claims tasks for agents, sets them to working
5. Broadcasts every state change via WebSocket so the canvas updates live
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .state import CompanyState

from ..models import AgentStatus, TaskStatus, EventType, PlanStatus, ProjectStatus


class Orchestrator:
    """Drives plan execution — dispatches tasks to agents."""

    def __init__(self, state: "CompanyState") -> None:
        self.state = state
        self._running: dict[str, asyncio.Task] = {}  # plan_id -> asyncio task

    def is_running(self, plan_id: str) -> bool:
        task = self._running.get(plan_id)
        return task is not None and not task.done()

    async def run_plan(self, plan_id: str) -> None:
        """Start executing a plan."""
        if self.is_running(plan_id):
            return

        plan = self.state.plans.get(plan_id)
        if not plan:
            return

        task = asyncio.create_task(self._execute_plan(plan_id))
        self._running[plan_id] = task

    async def stop_plan(self, plan_id: str) -> None:
        """Stop a running plan."""
        task = self._running.get(plan_id)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self._running.pop(plan_id, None)

        plan = self.state.plans.get(plan_id)
        if plan:
            plan.status = PlanStatus.APPROVED  # back to approved, can be re-run
            plan.updated_at = datetime.now(timezone.utc)

            project = self.state.projects.get(plan.project_id)
            if project:
                # set working agents back to idle
                for aid in project.agent_ids:
                    agent = self.state.agents.get(aid)
                    if agent and agent.status == AgentStatus.WORKING:
                        agent.status = AgentStatus.IDLE
                        agent.thinking = None
                project.status = ProjectStatus.PAUSED
                project.updated_at = datetime.now(timezone.utc)

            await self.state.broadcast_canvas()

    async def _execute_plan(self, plan_id: str) -> None:
        """Main execution loop for a plan."""
        plan = self.state.plans.get(plan_id)
        if not plan:
            return

        project = self.state.projects.get(plan.project_id)
        if not project:
            return

        # activate the plan
        self.state.update_plan_status(plan_id, PlanStatus.ACTIVE)
        project.status = ProjectStatus.ACTIVE
        project.updated_at = datetime.now(timezone.utc)

        # generate tasks if plan has none
        if not plan.task_ids:
            self.state.generate_tasks_from_plan_obj(plan_id)

        self.state._emit(EventType.GATE_PASS, "", message=f"▶ Plan '{plan.name}' started in {project.name}")
        await self.state.broadcast_canvas()

        try:
            while True:
                # find open tasks for THIS plan
                open_tasks = [
                    self.state.tasks[tid]
                    for tid in plan.task_ids
                    if tid in self.state.tasks
                    and self.state.tasks[tid].status == TaskStatus.OPEN
                ]

                if not open_tasks:
                    # check if all done
                    all_tasks = [
                        self.state.tasks[tid]
                        for tid in plan.task_ids
                        if tid in self.state.tasks
                    ]
                    in_progress = [t for t in all_tasks if t.status == TaskStatus.CLAIMED]
                    if not in_progress:
                        break
                    await asyncio.sleep(1)
                    continue

                # find idle agents in the project
                idle_agents = [
                    self.state.agents[aid]
                    for aid in project.agent_ids
                    if aid in self.state.agents
                    and self.state.agents[aid].status == AgentStatus.IDLE
                ]

                # dispatch
                for agent in idle_agents:
                    if not open_tasks:
                        break

                    task = open_tasks.pop(0)
                    self.state.claim_task(task.id, agent.id)
                    await self.state.broadcast_canvas()

                    asyncio.create_task(
                        self._agent_work_loop(plan_id, agent.id, task.id)
                    )

                await asyncio.sleep(0.5)

        except asyncio.CancelledError:
            raise
        finally:
            plan = self.state.plans.get(plan_id)
            project = self.state.projects.get(plan.project_id) if plan else None

            if plan:
                all_tasks = [
                    self.state.tasks[tid]
                    for tid in plan.task_ids
                    if tid in self.state.tasks
                ]
                all_done = all(t.status == TaskStatus.DONE for t in all_tasks) if all_tasks else False
                if all_done:
                    plan.status = PlanStatus.COMPLETED
                    plan.updated_at = datetime.now(timezone.utc)
                    self.state._emit(EventType.GATE_PASS, "", message=f"✓ Plan '{plan.name}' completed!")

                    if project:
                        # check if ALL project plans are completed
                        all_plans_done = all(
                            self.state.plans[pid].status == PlanStatus.COMPLETED
                            for pid in project.plan_ids
                            if pid in self.state.plans
                        )
                        if all_plans_done:
                            project.status = ProjectStatus.COMPLETED
                        project.updated_at = datetime.now(timezone.utc)

            await self.state.broadcast_canvas()
            self._running.pop(plan_id, None)

    async def _agent_work_loop(self, plan_id: str, agent_id: str, task_id: str) -> None:
        """Simulate an agent working on a task.

        In the future this will spawn a real OpenClaw session.
        For now it simulates the autonomous-dev loop with realistic timing.
        """
        agent = self.state.agents.get(agent_id)
        task = self.state.tasks.get(task_id)
        plan = self.state.plans.get(plan_id)
        if not agent or not task or not plan:
            return

        project = self.state.projects.get(plan.project_id)

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
                agent.thinking = f"implementing ({i+1}/{iterations})"
                await self.state.broadcast_canvas()
                await asyncio.sleep(random.uniform(1.5, 3.0))

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

            # message the architect if one exists
            if project:
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

            # done
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
