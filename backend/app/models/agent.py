"""Agent model — a worker on the infinite canvas."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    IMPLEMENTER = "implementer"
    TESTER = "tester"
    ARCHITECT = "architect"
    REVIEWER = "reviewer"
    INTEGRATOR = "integrator"
    SCOUT = "scout"


class AgentStatus(str, Enum):
    IDLE = "idle"
    WORKING = "working"
    STUCK = "stuck"
    REVIEWING = "reviewing"
    PUSHING = "pushing"
    OFFLINE = "offline"


class Agent(BaseModel):
    """An agent on the canvas. Has a role, scope, branch, and position."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    role: AgentRole
    status: AgentStatus = AgentStatus.IDLE

    # scope
    branch: Optional[str] = None
    owned_paths: list[str] = Field(default_factory=list)
    program_file: str = "program.md"

    # canvas position
    x: float = 0.0
    y: float = 0.0

    # state
    current_task_id: Optional[str] = None
    last_commit: Optional[str] = None
    commits_this_session: int = 0
    reverts_this_session: int = 0
    thinking: Optional[str] = None  # what the agent is currently doing

    # meta
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: Optional[datetime] = None

    def to_canvas_node(self) -> dict:
        """Serialize for the frontend canvas."""
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role.value,
            "status": self.status.value,
            "x": self.x,
            "y": self.y,
            "branch": self.branch,
            "owned_paths": self.owned_paths,
            "current_task_id": self.current_task_id,
            "last_commit": self.last_commit,
            "commits": self.commits_this_session,
            "reverts": self.reverts_this_session,
            "thinking": self.thinking,
        }
