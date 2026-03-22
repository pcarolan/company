"""Task model — a unit of work tracked on the canvas."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    OPEN = "open"
    CLAIMED = "claimed"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"
    DISCARDED = "discarded"


class Task(BaseModel):
    """A task that agents claim and work on."""

    id: str = Field(default_factory=lambda: f"task-{str(uuid.uuid4())[:6]}")
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.OPEN
    priority: int = 2  # 0=critical, 4=backlog

    # ownership
    project_id: Optional[str] = None

    # assignment
    assigned_agent_id: Optional[str] = None
    discovered_from: Optional[str] = None

    # canvas position (near the assigned agent)
    x: float = 0.0
    y: float = 0.0

    # meta
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    close_reason: Optional[str] = None
