"""Plan model — a versioned plan within a project."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PlanStatus(str, Enum):
    DRAFT = "draft"          # being written or edited
    PROPOSED = "proposed"    # submitted for review
    APPROVED = "approved"    # approved, ready to generate tasks
    ACTIVE = "active"        # currently being executed
    COMPLETED = "completed"  # all tasks done
    REJECTED = "rejected"    # rejected, won't be executed
    SUPERSEDED = "superseded"  # replaced by a newer plan


class Plan(BaseModel):
    """A plan within a project. Projects can have many plans."""

    id: str = Field(default_factory=lambda: f"plan-{str(uuid.uuid4())[:6]}")
    project_id: str
    name: str  # e.g. "v1", "auth-rewrite", "phase-2"
    content: str = ""  # the markdown plan content
    status: PlanStatus = PlanStatus.DRAFT

    # who wrote it
    author_agent_id: Optional[str] = None  # null = human-authored
    author_name: str = "human"

    # linked tasks
    task_ids: list[str] = Field(default_factory=list)

    # meta
    version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "content": self.content,
            "status": self.status.value,
            "author_agent_id": self.author_agent_id,
            "author_name": self.author_name,
            "task_ids": self.task_ids,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
