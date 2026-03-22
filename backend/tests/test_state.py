"""Tests for CompanyState."""

from app.models import AgentRole, AgentStatus, TaskStatus
from app.services import CompanyState


def test_add_agent():
    s = CompanyState()
    agent = s.add_agent("test-agent", AgentRole.IMPLEMENTER, ["src/"])
    assert agent.name == "test-agent"
    assert agent.role == AgentRole.IMPLEMENTER
    assert agent.status == AgentStatus.IDLE
    assert agent.id in s.agents


def test_claim_task():
    s = CompanyState()
    agent = s.add_agent("worker", AgentRole.IMPLEMENTER)
    task = s.add_task("Do the thing", priority=1)
    s.claim_task(task.id, agent.id)

    assert task.status == TaskStatus.CLAIMED
    assert task.assigned_agent_id == agent.id
    assert agent.current_task_id == task.id
    assert agent.status == AgentStatus.WORKING


def test_close_task():
    s = CompanyState()
    agent = s.add_agent("worker", AgentRole.IMPLEMENTER)
    task = s.add_task("Do the thing")
    s.claim_task(task.id, agent.id)
    s.close_task(task.id, "Done")

    assert task.status == TaskStatus.DONE
    assert task.close_reason == "Done"
    assert agent.current_task_id is None
    assert agent.status == AgentStatus.IDLE


def test_record_commit():
    s = CompanyState()
    agent = s.add_agent("worker", AgentRole.IMPLEMENTER)
    event = s.record_commit(agent.id, "abc1234", "feat: add auth")

    assert event.type.value == "commit"
    assert agent.commits_this_session == 1
    assert agent.last_commit == "abc1234"


def test_record_revert():
    s = CompanyState()
    agent = s.add_agent("worker", AgentRole.IMPLEMENTER)
    s.record_revert(agent.id, "bad idea")

    assert agent.reverts_this_session == 1


def test_canvas_state():
    s = CompanyState()
    s.add_agent("a", AgentRole.IMPLEMENTER, x=10, y=20)
    s.add_task("t", x=30, y=40)

    canvas = s.get_canvas_state()
    assert len(canvas["agents"]) == 1
    assert len(canvas["tasks"]) == 1
    assert canvas["agents"][0]["x"] == 10
    assert canvas["tasks"][0]["x"] == 30
