"""Agent model — a worker on the infinite canvas.

Each agent is a full OpenClaw instance with its own:
- SOUL.md (persona, personality, boundaries)
- MEMORY.md (long-term curated memory)
- memory/ directory (daily notes)
- program.md (how it works)
"""

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
    PLANNER = "planner"


class AgentStatus(str, Enum):
    IDLE = "idle"
    WORKING = "working"
    STUCK = "stuck"
    REVIEWING = "reviewing"
    PUSHING = "pushing"
    OFFLINE = "offline"


class Agent(BaseModel):
    """An agent on the canvas. Each is a full OpenClaw instance."""

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

    # identity — each agent is its own OpenClaw instance
    soul: str = ""  # SOUL.md content
    memory: str = ""  # MEMORY.md content
    daily_notes: dict[str, str] = Field(default_factory=dict)  # date -> content
    program: str = ""  # program.md content

    # state
    current_task_id: Optional[str] = None
    last_commit: Optional[str] = None
    commits_this_session: int = 0
    reverts_this_session: int = 0
    thinking: Optional[str] = None

    # cost tracking (OpenRouter)
    cost_usd: float = 0.0
    tokens_prompt: int = 0
    tokens_completion: int = 0
    api_calls: int = 0

    # openclaw session
    session_id: Optional[str] = None  # OpenClaw session key when running

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
            "cost_usd": self.cost_usd,
            "tokens_prompt": self.tokens_prompt,
            "tokens_completion": self.tokens_completion,
            "api_calls": self.api_calls,
            "session_id": self.session_id,
            # include whether identity files exist (not the full content)
            "has_soul": bool(self.soul),
            "has_memory": bool(self.memory),
            "has_program": bool(self.program),
            "daily_note_count": len(self.daily_notes),
        }
