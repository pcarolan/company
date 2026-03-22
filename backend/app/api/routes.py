"""REST API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..models import AgentRole, AgentStatus, ProjectStatus
from ..services import CompanyState

router = APIRouter(prefix="/api")

# shared state — injected from main
state: CompanyState = CompanyState()


def set_state(s: CompanyState) -> None:
    global state
    state = s


# --- request models ---

class CreateAgentRequest(BaseModel):
    name: str
    role: AgentRole
    owned_paths: list[str] = []
    x: float = 0.0
    y: float = 0.0


class MoveAgentRequest(BaseModel):
    x: float
    y: float


class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    priority: int = 2
    x: float = 0.0
    y: float = 0.0
    discovered_from: Optional[str] = None
    project_id: Optional[str] = None


class ClaimTaskRequest(BaseModel):
    agent_id: str


class CloseTaskRequest(BaseModel):
    reason: str = ""


class CommitRequest(BaseModel):
    agent_id: str
    sha: str
    message: str


class RevertRequest(BaseModel):
    agent_id: str
    reason: str = ""


class GateResultRequest(BaseModel):
    agent_id: str
    passed: bool
    gate_name: str = ""


class MessageRequest(BaseModel):
    from_id: str
    to_id: str
    text: str


class ThinkingRequest(BaseModel):
    thinking: Optional[str] = None


class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""
    repo: Optional[str] = None
    gates: dict[str, str] = {}
    x: float = 0.0
    y: float = 0.0
    width: float = 600.0
    height: float = 400.0


class AssignToProjectRequest(BaseModel):
    id: str  # agent_id or task_id


class SetPlanRequest(BaseModel):
    plan: str


# --- endpoints ---

@router.get("/canvas")
def get_canvas():
    """Full canvas state."""
    return state.get_canvas_state()


@router.get("/agents")
def list_agents():
    return [a.to_canvas_node() for a in state.agents.values()]


@router.post("/agents")
def create_agent(req: CreateAgentRequest):
    agent = state.add_agent(
        name=req.name,
        role=req.role,
        owned_paths=req.owned_paths,
        x=req.x,
        y=req.y,
    )
    return agent.to_canvas_node()


@router.get("/agents/{agent_id}")
def get_agent(agent_id: str):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_canvas_node()


@router.put("/agents/{agent_id}/status")
def update_agent_status(agent_id: str, status: AgentStatus):
    agent = state.update_agent_status(agent_id, status)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_canvas_node()


@router.put("/agents/{agent_id}/position")
def move_agent(agent_id: str, req: MoveAgentRequest):
    agent = state.move_agent(agent_id, req.x, req.y)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_canvas_node()


@router.get("/tasks")
def list_tasks():
    return [t.model_dump(mode="json") for t in state.tasks.values()]


@router.post("/tasks")
def create_task(req: CreateTaskRequest):
    task = state.add_task(
        title=req.title,
        description=req.description,
        priority=req.priority,
        x=req.x,
        y=req.y,
        discovered_from=req.discovered_from,
        project_id=req.project_id,
    )
    return task.model_dump(mode="json")


@router.post("/projects/{project_id}/tasks/create")
def create_task_in_project(project_id: str, req: CreateTaskRequest):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    task = state.add_task(
        title=req.title,
        description=req.description,
        priority=req.priority,
        x=req.x,
        y=req.y,
        discovered_from=req.discovered_from,
        project_id=project_id,
    )
    return task.model_dump(mode="json")


@router.get("/projects/{project_id}/tasks")
def list_project_tasks(project_id: str):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    tasks = [state.tasks[tid] for tid in project.task_ids if tid in state.tasks]
    return [t.model_dump(mode="json") for t in tasks]


@router.post("/tasks/{task_id}/claim")
def claim_task(task_id: str, req: ClaimTaskRequest):
    task = state.claim_task(task_id, req.agent_id)
    if not task:
        raise HTTPException(404, "Task not found or not claimable")
    return task.model_dump(mode="json")


@router.post("/tasks/{task_id}/close")
def close_task(task_id: str, req: CloseTaskRequest):
    task = state.close_task(task_id, req.reason)
    if not task:
        raise HTTPException(404, "Task not found")
    return task.model_dump(mode="json")


@router.get("/events")
def list_events(limit: int = 50):
    events = state.events[-limit:]
    return [e.model_dump(mode="json") for e in events]


@router.post("/events/commit")
def record_commit(req: CommitRequest):
    event = state.record_commit(req.agent_id, req.sha, req.message)
    return event.model_dump(mode="json")


@router.post("/events/revert")
def record_revert(req: RevertRequest):
    event = state.record_revert(req.agent_id, req.reason)
    return event.model_dump(mode="json")


@router.post("/events/gate")
def record_gate(req: GateResultRequest):
    event = state.record_gate_result(req.agent_id, req.passed, req.gate_name)
    return event.model_dump(mode="json")


@router.post("/events/message")
def send_message(req: MessageRequest):
    event = state.send_message(req.from_id, req.to_id, req.text)
    if not event:
        raise HTTPException(404, "Sender or receiver not found")
    return event.model_dump(mode="json")


@router.get("/projects")
def list_projects():
    return [p.to_canvas_node() for p in state.projects.values()]


@router.post("/projects")
def create_project(req: CreateProjectRequest):
    project = state.add_project(
        name=req.name,
        description=req.description,
        repo=req.repo,
        gates=req.gates,
        x=req.x,
        y=req.y,
        width=req.width,
        height=req.height,
    )
    return project.to_canvas_node()


@router.get("/projects/{project_id}")
def get_project(project_id: str):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project.to_canvas_node()


@router.put("/projects/{project_id}/status")
def update_project_status(project_id: str, status: ProjectStatus):
    project = state.update_project_status(project_id, status)
    if not project:
        raise HTTPException(404, "Project not found")
    return project.to_canvas_node()


@router.get("/projects/{project_id}/plan")
def get_project_plan(project_id: str):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return {"plan": project.plan}


@router.put("/projects/{project_id}/plan")
def set_project_plan(project_id: str, req: SetPlanRequest):
    project = state.set_project_plan(project_id, req.plan)
    if not project:
        raise HTTPException(404, "Project not found")
    return project.to_canvas_node()


@router.post("/projects/{project_id}/plan/generate-tasks")
def generate_tasks_from_plan(project_id: str):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    tasks = state.generate_tasks_from_plan(project_id)
    return {
        "generated": len(tasks),
        "tasks": [t.model_dump(mode="json") for t in tasks],
    }


@router.post("/projects/{project_id}/agents")
def assign_agent_to_project(project_id: str, req: AssignToProjectRequest):
    project = state.assign_agent_to_project(project_id, req.id)
    if not project:
        raise HTTPException(404, "Project or agent not found")
    return project.to_canvas_node()


@router.post("/projects/{project_id}/tasks")
def assign_task_to_project(project_id: str, req: AssignToProjectRequest):
    project = state.assign_task_to_project(project_id, req.id)
    if not project:
        raise HTTPException(404, "Project or task not found")
    return project.to_canvas_node()


@router.put("/agents/{agent_id}/thinking")
def set_thinking(agent_id: str, req: ThinkingRequest):
    agent = state.set_thinking(agent_id, req.thinking)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_canvas_node()
