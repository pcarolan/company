"""In-memory company state. The single source of truth for the canvas."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from ..models import Agent, AgentRole, AgentStatus, Task, TaskStatus, Event, EventType, Project, ProjectStatus


class CompanyState:
    """Holds all agents, tasks, and events. Broadcasts changes via WebSocket."""

    def __init__(self) -> None:
        self.agents: dict[str, Agent] = {}
        self.tasks: dict[str, Task] = {}
        self.projects: dict[str, Project] = {}
        self.events: list[Event] = []
        self._ws_connections: list = []

    # --- agents ---

    def add_agent(
        self,
        name: str,
        role: AgentRole,
        owned_paths: list[str] | None = None,
        x: float = 0.0,
        y: float = 0.0,
    ) -> Agent:
        agent = Agent(
            name=name,
            role=role,
            owned_paths=owned_paths or [],
            x=x,
            y=y,
        )
        self.agents[agent.id] = agent
        return agent

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self.agents.get(agent_id)

    def update_agent_status(self, agent_id: str, status: AgentStatus) -> Optional[Agent]:
        agent = self.agents.get(agent_id)
        if agent:
            agent.status = status
            agent.last_active = datetime.now(timezone.utc)
        return agent

    def move_agent(self, agent_id: str, x: float, y: float) -> Optional[Agent]:
        agent = self.agents.get(agent_id)
        if agent:
            agent.x = x
            agent.y = y
        return agent

    # --- tasks ---

    def add_task(
        self,
        title: str,
        description: str = "",
        priority: int = 2,
        x: float = 0.0,
        y: float = 0.0,
        discovered_from: str | None = None,
        project_id: str | None = None,
    ) -> Task:
        task = Task(
            title=title,
            description=description,
            priority=priority,
            x=x,
            y=y,
            discovered_from=discovered_from,
            project_id=project_id,
        )
        self.tasks[task.id] = task
        # auto-register with project
        if project_id and project_id in self.projects:
            project = self.projects[project_id]
            if task.id not in project.task_ids:
                project.task_ids.append(task.id)
                project.updated_at = datetime.now(timezone.utc)
        return task

    def claim_task(self, task_id: str, agent_id: str) -> Optional[Task]:
        task = self.tasks.get(task_id)
        agent = self.agents.get(agent_id)
        if task and agent and task.status == TaskStatus.OPEN:
            task.status = TaskStatus.CLAIMED
            task.assigned_agent_id = agent_id
            agent.current_task_id = task_id
            agent.status = AgentStatus.WORKING
            agent.last_active = datetime.now(timezone.utc)
            self._emit(EventType.TASK_CLAIMED, agent_id, task_id, f"{agent.name} claimed '{task.title}'")
        return task

    def close_task(self, task_id: str, reason: str = "") -> Optional[Task]:
        task = self.tasks.get(task_id)
        if task:
            task.status = TaskStatus.DONE
            task.closed_at = datetime.now(timezone.utc)
            task.close_reason = reason
            if task.assigned_agent_id:
                agent = self.agents.get(task.assigned_agent_id)
                if agent:
                    agent.current_task_id = None
                    agent.status = AgentStatus.IDLE
                    self._emit(EventType.TASK_COMPLETED, agent.id, task_id, f"{agent.name} completed '{task.title}'")
        return task

    # --- events ---

    def record_commit(self, agent_id: str, sha: str, message: str) -> Event:
        agent = self.agents.get(agent_id)
        if agent:
            agent.last_commit = sha
            agent.commits_this_session += 1
            agent.last_active = datetime.now(timezone.utc)
        return self._emit(EventType.COMMIT, agent_id, message=message, data={"sha": sha})

    def record_revert(self, agent_id: str, reason: str = "") -> Event:
        agent = self.agents.get(agent_id)
        if agent:
            agent.reverts_this_session += 1
            agent.last_active = datetime.now(timezone.utc)
        return self._emit(EventType.REVERT, agent_id, message=reason)

    def record_gate_result(self, agent_id: str, passed: bool, gate_name: str = "") -> Event:
        event_type = EventType.GATE_PASS if passed else EventType.GATE_FAIL
        return self._emit(event_type, agent_id, message=gate_name)

    def send_message(self, from_id: str, to_id: str, text: str) -> Event | None:
        """Agent-to-agent message. Shows as a line on the canvas."""
        sender = self.agents.get(from_id)
        receiver = self.agents.get(to_id)
        if not sender or not receiver:
            return None
        sender.last_active = datetime.now(timezone.utc)
        return self._emit(
            EventType.MESSAGE,
            from_id,
            message=text,
            data={"to_id": to_id, "from_name": sender.name, "to_name": receiver.name},
        )

    def set_thinking(self, agent_id: str, text: str | None) -> Agent | None:
        """Set what an agent is currently doing. None clears it."""
        agent = self.agents.get(agent_id)
        if agent:
            agent.thinking = text
            agent.last_active = datetime.now(timezone.utc)
        return agent

    def _emit(
        self,
        event_type: EventType,
        agent_id: str,
        task_id: str | None = None,
        message: str = "",
        data: dict | None = None,
    ) -> Event:
        event = Event(
            type=event_type,
            agent_id=agent_id,
            task_id=task_id,
            message=message,
            data=data or {},
        )
        self.events.append(event)
        # keep last 500 events
        if len(self.events) > 500:
            self.events = self.events[-500:]
        return event

    # --- projects ---

    def add_project(
        self,
        name: str,
        description: str = "",
        repo: str | None = None,
        gates: dict[str, str] | None = None,
        x: float = 0.0,
        y: float = 0.0,
        width: float = 600.0,
        height: float = 400.0,
    ) -> Project:
        project = Project(
            name=name,
            description=description,
            repo=repo,
            gates=gates or {},
            x=x,
            y=y,
            width=width,
            height=height,
        )
        self.projects[project.id] = project
        return project

    def get_project(self, project_id: str) -> Project | None:
        return self.projects.get(project_id)

    def assign_agent_to_project(self, project_id: str, agent_id: str) -> Project | None:
        project = self.projects.get(project_id)
        agent = self.agents.get(agent_id)
        if project and agent and agent_id not in project.agent_ids:
            project.agent_ids.append(agent_id)
            project.updated_at = datetime.now(timezone.utc)
        return project

    def assign_task_to_project(self, project_id: str, task_id: str) -> Project | None:
        project = self.projects.get(project_id)
        task = self.tasks.get(task_id)
        if project and task and task_id not in project.task_ids:
            project.task_ids.append(task_id)
            project.updated_at = datetime.now(timezone.utc)
        return project

    def set_project_plan(self, project_id: str, plan: str) -> Project | None:
        project = self.projects.get(project_id)
        if project:
            project.plan = plan
            project.updated_at = datetime.now(timezone.utc)
        return project

    def generate_tasks_from_plan(self, project_id: str) -> list[Task]:
        """Parse plan.md into tasks. Tasks are lines starting with '- [ ]' or '- '."""
        project = self.projects.get(project_id)
        if not project or not project.plan:
            return []

        new_tasks: list[Task] = []
        lines = project.plan.strip().split("\n")

        current_priority = 2
        for line in lines:
            stripped = line.strip()

            # priority headers: ## P0, ## P1, etc.
            if stripped.startswith("## P") and len(stripped) >= 5 and stripped[4].isdigit():
                current_priority = int(stripped[4])
                continue

            # task lines: - [ ] or - (not sub-bullets)
            task_title = None
            if stripped.startswith("- [ ] "):
                task_title = stripped[6:].strip()
            elif stripped.startswith("- ") and not stripped.startswith("  -"):
                # skip lines that look like descriptions (lowercase start after a task)
                candidate = stripped[2:].strip()
                if candidate and candidate[0].isupper():
                    task_title = candidate

            if task_title:
                # check for agent assignment hint: [agent-name] at end
                assigned_hint = None
                if task_title.endswith("]") and "[" in task_title:
                    bracket_start = task_title.rfind("[")
                    assigned_hint = task_title[bracket_start + 1:-1].strip()
                    task_title = task_title[:bracket_start].strip()

                task = self.add_task(
                    title=task_title,
                    priority=current_priority,
                    project_id=project_id,
                )

                # try to match assignment hint to an agent
                if assigned_hint:
                    for agent in self.agents.values():
                        if agent.name == assigned_hint and agent.id in project.agent_ids:
                            self.claim_task(task.id, agent.id)
                            break

                new_tasks.append(task)

        return new_tasks

    def update_project_status(self, project_id: str, status: ProjectStatus) -> Project | None:
        project = self.projects.get(project_id)
        if project:
            project.status = status
            project.updated_at = datetime.now(timezone.utc)
        return project

    # --- canvas state ---

    def get_canvas_state(self) -> dict:
        """Full canvas state for initial load or reconnect."""
        return {
            "agents": [a.to_canvas_node() for a in self.agents.values()],
            "tasks": [t.model_dump(mode="json") for t in self.tasks.values()],
            "projects": [p.to_canvas_node() for p in self.projects.values()],
            "events": [e.model_dump(mode="json") for e in self.events[-50:]],
        }
