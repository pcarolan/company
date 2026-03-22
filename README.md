# Company

A single system for building software with agent teams.

**OpenClaw** is the interface — you talk to it. **The canvas** is the visualization — you watch agents work. **plan.md** is the control plane — you write what needs building, agents execute it.

One container. One system. The company app IS the company.

## How It Works

```
┌─────────────────────────────────────────────┐
│              Docker Container               │
│                                             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  OpenClaw    │  │  Company Backend     │  │
│  │  (agent      │──│  (FastAPI + state    │  │
│  │   runtime)   │  │   + WebSocket)       │  │
│  └──────┬───────┘  └──────────┬───────────┘  │
│         │                     │              │
│         │  spawns agents      │  serves UI   │
│         │  via sessions       │  + real-time │
│         ▼                     ▼              │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Agents     │  │  Frontend (React)    │  │
│  │  running    │──│  infinite canvas     │  │
│  │  program.md │  │  served as static    │  │
│  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘
         │                     │
    you talk to           you watch on
     OpenClaw             the canvas
```

1. You write a **plan.md** — what needs building, which agents, what gates
2. You tell OpenClaw to **start the project**
3. OpenClaw **spawns agents** — each gets a program.md, a branch, a scope
4. Agents enter the **autonomous-dev loop** — plan → code → verify → commit → repeat
5. The **canvas shows everything** — agents working, messages flying, commits landing
6. You watch. Or sleep. They keep going.

## Stack

- **Runtime:** OpenClaw (agent orchestration, chat interface)
- **Backend:** FastAPI (Python) — state, WebSocket, agent coordination
- **Frontend:** React + Vite + Tailwind — infinite canvas UI
- **Design:** Radiohead aesthetic — parchment, typewriter, muted reds
- **All in one container**

## Entrypoints

Everything runs in one Docker image. The entrypoint selects the mode:

| Command | What it runs | Port |
|---|---|---|
| `docker run company` | All services (default) | 8000 |
| `docker run company backend` | FastAPI backend only | 8000 |
| `docker run company frontend-dev` | Vite dev server | 3000 |
| `docker run company openclaw` | OpenClaw gateway | 18789 |

### `all` (default)

Supervisord starts the backend, which serves the built React frontend as static files. One port, one process tree. This is production mode.

### `backend`

Runs just the FastAPI server. Useful for development when you want to run the frontend separately with hot reload.

### `frontend-dev`

Runs the Vite dev server with hot module replacement. Proxies API calls to the backend at `:8000`. For development only.

### `openclaw`

Runs the OpenClaw gateway — the agent runtime. Spawns agents, handles chat, routes messages. In production, supervisord starts this alongside the backend.

## Run

### Docker (production)

```bash
docker build -t company .
docker run -p 8000:8000 company
```

Canvas + API at **http://localhost:8000**

### Dev Mode (recommended)

```bash
./dev.sh
```

That's it. Backend + frontend start with hot reload. Edit any file, see changes instantly:
- **Python changes** → uvicorn auto-restarts (~1s)
- **React/CSS changes** → Vite HMR (instant, no refresh)

Canvas at **http://localhost:3000** → proxies API to :8000

### Docker Dev (with volume mounts)

```bash
docker compose -f docker-compose.dev.yml up
```

Same hot reload, but inside containers. Source is mounted as volumes — edit locally, changes reflect immediately.

### Manual (two terminals)

```bash
# Terminal 1: Backend
cd backend && uv sync --extra dev && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```

## API

### Projects

```bash
# List projects
GET /api/projects

# Create project
POST /api/projects
{"name": "auth-service", "description": "JWT auth", "gates": {"test": "pytest"}}

# Set project plan
PUT /api/projects/{id}/plan
{"plan": "# auth-service\n\n## P0\n- [ ] JWT tokens\n- [ ] Refresh flow"}

# Generate tasks from plan
POST /api/projects/{id}/plan/generate-tasks

# List project tasks
GET /api/projects/{id}/tasks
```

### Agents

```bash
GET /api/agents
POST /api/agents
POST /api/agents/{id}/status  {"status": "working"}
POST /api/agents/{id}/thinking  {"thinking": "implementing JWT validation"}
```

### Tasks

```bash
GET /api/tasks
POST /api/tasks  {"title": "...", "project_id": "..."}
POST /api/projects/{id}/tasks/create  {"title": "..."}
```

### Events

```bash
GET /api/events
POST /api/events/commit  {"agent_id": "...", "message": "...", "sha": "..."}
POST /api/events/revert  {"agent_id": "...", "message": "...", "sha": "..."}
```

### WebSocket

```
ws://localhost:8000/ws
```

Pushes real-time state updates: agent status changes, new events, messages, task claims.

## plan.md

The plan is the source of truth. Format:

```markdown
# project-name

What this project is about.

## P0
- [ ] Critical task [agent-name]
- [ ] Another critical task

## P1
- [ ] Important feature [other-agent]

## P2
- [ ] Nice to have
```

- `## P0` through `## P4` set task priority
- `[agent-name]` at the end auto-assigns to that agent
- `POST /projects/{id}/plan/generate-tasks` parses the plan into tasks

## Built On

- [autonomous-dev](https://github.com/pcarolan/radiohead/tree/master/skills/autonomous-dev) — the agent workflow
- [program.md](https://github.com/pcarolan/radiohead/blob/master/program.md) — the philosophy
- No framework. Markdown is the control plane.
