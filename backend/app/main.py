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

    # project with plan
    plan = """# company-app

Build the infinite canvas app that is and represents the company.

## P1
- [ ] Set up auth module [auth-impl]
- [ ] API route scaffolding [api-impl]
- [ ] Write integration tests [test-agent]

## P2
- [ ] WebSocket real-time sync
- [ ] Agent-to-agent messaging UI
- [ ] Project sidebar drill-down

## P3
- [ ] Persistent storage (replace in-memory state)
- [ ] Git integration for agent branches
"""

    project = state.add_project(
        name="company-app",
        description="The infinite canvas app itself",
        gates={"build": "npm run build", "test": "pytest", "lint": "ruff check ."},
        x=-350,
        y=-250,
        width=700,
        height=600,
    )
    state.set_project_plan(project.id, plan)

    # agents
    a1 = state.add_agent("auth-impl", AgentRole.IMPLEMENTER, ["src/auth/"], x=-200, y=-100)
    a2 = state.add_agent("api-impl", AgentRole.IMPLEMENTER, ["src/api/"], x=200, y=-100)
    a3 = state.add_agent("test-agent", AgentRole.TESTER, ["tests/"], x=0, y=200)
    a4 = state.add_agent("architect", AgentRole.ARCHITECT, ["docs/"], x=0, y=-200)

    # assign agents to project
    for a in [a1, a2, a3, a4]:
        state.assign_agent_to_project(project.id, a.id)

    # generate tasks from plan (auto-assigns where [agent-name] hints exist)
    state.generate_tasks_from_plan(project.id)
