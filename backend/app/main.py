"""Company — the app that is the company."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router, set_state as set_routes_state
from .api.websocket import ws_router, set_state as set_ws_state
from .services import CompanyState
from .models import AgentRole

app = FastAPI(
    title="Company",
    description="An infinite canvas of autonomous agents",
    version="0.1.0",
)

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# shared state
state = CompanyState()
set_routes_state(state)
set_ws_state(state)

# register routes
app.include_router(router)
app.include_router(ws_router)


@app.on_event("startup")
async def seed_demo_data():
    """Seed demo data so the canvas isn't empty on first load."""

    # project
    project = state.add_project(
        name="company-app",
        description="The infinite canvas app itself",
        gates={"build": "npm run build", "test": "pytest", "lint": "ruff check ."},
        x=-350,
        y=-250,
        width=700,
        height=600,
    )

    # agents
    a1 = state.add_agent("auth-impl", AgentRole.IMPLEMENTER, ["src/auth/"], x=-200, y=-100)
    a2 = state.add_agent("api-impl", AgentRole.IMPLEMENTER, ["src/api/"], x=200, y=-100)
    a3 = state.add_agent("test-agent", AgentRole.TESTER, ["tests/"], x=0, y=200)
    a4 = state.add_agent("architect", AgentRole.ARCHITECT, ["docs/"], x=0, y=-200)

    # assign agents to project
    for a in [a1, a2, a3, a4]:
        state.assign_agent_to_project(project.id, a.id)

    # tasks
    t1 = state.add_task("Set up auth module", "JWT + refresh tokens", priority=1, x=-250, y=0)
    t2 = state.add_task("API route scaffolding", "REST endpoints for agents and tasks", priority=1, x=250, y=0)
    t3 = state.add_task("Write integration tests", "Test agent ↔ task lifecycle", priority=2, x=0, y=300)

    # assign tasks to project
    for t in [t1, t2, t3]:
        state.assign_task_to_project(project.id, t.id)
