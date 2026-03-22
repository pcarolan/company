"""REST API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..models import AgentRole, AgentStatus, ProjectStatus
from ..services import CompanyState, GitService

router = APIRouter(prefix="/api")

# shared state — injected from main
state: CompanyState = CompanyState()
git: GitService = GitService()


def set_state(s: CompanyState) -> None:
    global state
    state = s


def set_git(g: GitService) -> None:
    global git
    git = g


# --- request models ---

class CreateAgentRequest(BaseModel):
    name: str
    role: AgentRole
    owned_paths: list[str] = []
    soul: str = ""
    program: str = ""
    x: float = 0.0
    y: float = 0.0


class UpdateAgentFileRequest(BaseModel):
    content: str


class UpdateDailyNoteRequest(BaseModel):
    content: str


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
    create_repo: bool = True  # auto-create GitHub repo
    private: bool = False
    gates: dict[str, str] = {}
    plan: str = ""
    program: str = ""
    x: float = 0.0
    y: float = 0.0
    width: float = 600.0
    height: float = 400.0


class AssignToProjectRequest(BaseModel):
    id: str  # agent_id or task_id


class SetPlanRequest(BaseModel):
    plan: str


class RecordCostRequest(BaseModel):
    agent_id: str
    cost_usd: float
    tokens_prompt: int = 0
    tokens_completion: int = 0


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
        soul=req.soul,
        program=req.program,
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


# --- agent identity files ---

@router.get("/agents/{agent_id}/soul")
def get_agent_soul(agent_id: str):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"content": agent.soul}


@router.put("/agents/{agent_id}/soul")
def set_agent_soul(agent_id: str, req: UpdateAgentFileRequest):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    agent.soul = req.content
    agent.last_active = None  # will be set by datetime.now below
    return {"ok": True}


@router.get("/agents/{agent_id}/memory")
def get_agent_memory(agent_id: str):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"content": agent.memory}


@router.put("/agents/{agent_id}/memory")
def set_agent_memory(agent_id: str, req: UpdateAgentFileRequest):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    agent.memory = req.content
    return {"ok": True}


@router.get("/agents/{agent_id}/program")
def get_agent_program(agent_id: str):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"content": agent.program}


@router.put("/agents/{agent_id}/program")
def set_agent_program(agent_id: str, req: UpdateAgentFileRequest):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    agent.program = req.content
    return {"ok": True}


@router.get("/agents/{agent_id}/notes")
def list_agent_notes(agent_id: str):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {"dates": sorted(agent.daily_notes.keys(), reverse=True)}


@router.get("/agents/{agent_id}/notes/{date}")
def get_agent_note(agent_id: str, date: str):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    content = agent.daily_notes.get(date, "")
    return {"date": date, "content": content}


@router.put("/agents/{agent_id}/notes/{date}")
def set_agent_note(agent_id: str, date: str, req: UpdateDailyNoteRequest):
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    agent.daily_notes[date] = req.content
    return {"ok": True}


@router.get("/agents/{agent_id}/identity")
def get_agent_identity(agent_id: str):
    """Full agent identity — all files in one response."""
    agent = state.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return {
        "id": agent.id,
        "name": agent.name,
        "role": agent.role.value,
        "soul": agent.soul,
        "memory": agent.memory,
        "program": agent.program,
        "daily_notes": agent.daily_notes,
    }


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
    repo_url = req.repo

    # auto-create GitHub repo if requested and no repo URL provided
    if req.create_repo and not repo_url:
        repo_url = git.create_repo(
            name=req.name,
            description=req.description,
            private=req.private,
        )

    project = state.add_project(
        name=req.name,
        description=req.description,
        repo=repo_url,
        gates=req.gates,
        x=req.x,
        y=req.y,
        width=req.width,
        height=req.height,
    )

    # set plan + program if provided
    if req.plan:
        state.set_project_plan(project.id, req.plan)
    if req.program:
        project.base_program = req.program

    # init local working directory + push initial files
    if repo_url:
        git.init_local(req.name, repo_url)
        git.init_project_files(
            req.name,
            plan=project.plan,
            program=project.base_program,
            gates=req.gates,
        )

    return project.to_canvas_node()


@router.post("/projects/{project_id}/init-repo")
def init_project_repo(project_id: str):
    """Create a GitHub repo for an existing project that doesn't have one."""
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    if project.repo:
        raise HTTPException(409, f"Project already has repo: {project.repo}")

    repo_url = git.create_repo(name=project.name, description=project.description)
    if not repo_url:
        raise HTTPException(500, "Failed to create repo — check GITHUB_TOKEN")

    project.repo = repo_url
    project.updated_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)

    git.init_local(project.name, repo_url)
    git.init_project_files(
        project.name,
        plan=project.plan,
        program=project.base_program,
        gates=project.gates,
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


@router.get("/projects/{project_id}/program")
def get_project_program(project_id: str):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return {"content": project.base_program}


@router.put("/projects/{project_id}/program")
def set_project_program(project_id: str, req: SetPlanRequest):
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    project.base_program = req.plan  # reusing SetPlanRequest for content
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


# --- cost tracking ---

@router.post("/cost")
def record_cost(req: RecordCostRequest):
    """Record an OpenRouter API call cost. Rolls up from agent → project."""
    agent = state.record_cost(
        agent_id=req.agent_id,
        cost_usd=req.cost_usd,
        tokens_prompt=req.tokens_prompt,
        tokens_completion=req.tokens_completion,
    )
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent.to_canvas_node()


@router.get("/projects/{project_id}/cost")
def get_project_cost(project_id: str):
    """Get cost breakdown for a project — total + per-agent."""
    project = state.get_project(project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    agent_costs = []
    for aid in project.agent_ids:
        agent = state.agents.get(aid)
        if agent:
            agent_costs.append({
                "agent_id": agent.id,
                "name": agent.name,
                "cost_usd": agent.cost_usd,
                "tokens_prompt": agent.tokens_prompt,
                "tokens_completion": agent.tokens_completion,
                "api_calls": agent.api_calls,
            })

    return {
        "project_id": project.id,
        "project_name": project.name,
        "total_cost_usd": project.cost_usd,
        "total_tokens_prompt": project.tokens_prompt,
        "total_tokens_completion": project.tokens_completion,
        "total_api_calls": project.api_calls,
        "agents": sorted(agent_costs, key=lambda a: a["cost_usd"], reverse=True),
    }
