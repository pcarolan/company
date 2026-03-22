"""Event model — things that happen on the canvas."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class EventType(str, Enum):
    COMMIT = "commit"
    REVERT = "revert"
    GATE_PASS = "gate_pass"
    GATE_FAIL = "gate_fail"
    TASK_CLAIMED = "task_claimed"
    TASK_COMPLETED = "task_completed"
    REVIEW_FINDING = "review_finding"
    REVIEW_CLEAN = "review_clean"
    AGENT_STUCK = "agent_stuck"
    AGENT_IDLE = "agent_idle"
    BRANCH_CREATED = "branch_created"
    BRANCH_MERGED = "branch_merged"
    MESSAGE = "message"  # agent-to-agent communication


class Event(BaseModel):
    """An event in the agent's work stream. Displayed on the canvas as activity."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: EventType
    agent_id: str
    task_id: Optional[str] = None
    message: str = ""
    data: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
