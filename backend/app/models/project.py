"""Project model — a body of work on the canvas that agents are assigned to."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Project(BaseModel):
    """A project groups agents and tasks under a shared goal."""

    id: str = Field(default_factory=lambda: f"proj-{str(uuid.uuid4())[:6]}")
    name: str
    description: str = ""
    status: ProjectStatus = ProjectStatus.PLANNING
    repo: Optional[str] = None  # git repo URL or path
    branch: Optional[str] = None  # main branch for this project

    # membership
    agent_ids: list[str] = Field(default_factory=list)
    task_ids: list[str] = Field(default_factory=list)

    # canvas position + dimensions (project is a region on the canvas)
    x: float = 0.0
    y: float = 0.0
    width: float = 600.0
    height: float = 400.0

    # config
    plan: str = ""  # the plan.md content — source of truth for tasks
    base_program: str = ""  # program.md — inherited by every agent in this project
    program_file: str = "program.md"
    gates: dict[str, str] = Field(default_factory=dict)  # gate_name: command

    # cost tracking (OpenRouter)
    cost_usd: float = 0.0
    tokens_prompt: int = 0
    tokens_completion: int = 0
    api_calls: int = 0

    # meta
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    def to_canvas_node(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value,
            "repo": self.repo,
            "branch": self.branch,
            "agent_ids": self.agent_ids,
            "task_ids": self.task_ids,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "plan": self.plan,
            "has_base_program": bool(self.base_program),
            "gates": self.gates,
            "program_file": self.program_file,
            "cost_usd": self.cost_usd,
            "tokens_prompt": self.tokens_prompt,
            "tokens_completion": self.tokens_completion,
            "api_calls": self.api_calls,
        }
