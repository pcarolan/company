# Company

An app that both **is** and **represents** an agent-powered company.

Agents live on an infinite canvas. Each agent has a role, a scope, and a program.md. The canvas is the org chart, the war room, and the build dashboard — all at once. You see them work. You see their branches, their commits, their test results, their conversations. You zoom in on an agent and you're reading its program. You zoom out and you see the whole company.

Built on the principles from [autonomous-dev](../skills/autonomous-dev/SKILL.md):
- No framework — markdown is the control plane
- Immutable gates — agents can't game the evaluation
- Git as memory — every action is a commit
- The human programs the organization, not the code

## Stack

- **Backend:** FastAPI (Python) — agent orchestration, WebSocket state sync
- **Frontend:** React + Vite — infinite canvas with Tailwind CSS
- **Agent Runtime:** OpenClaw (Docker) — the AI agents that do the work
- **Design:** Radiohead aesthetic — warm parchment, typewriter type, muted reds

## Prerequisites

- [uv](https://docs.astral.sh/uv/) — Python package manager (never use pip)
- [Node.js](https://nodejs.org/) 18+ and npm
- [Docker](https://www.docker.com/) — for OpenClaw

## Run Locally

You need three things running: OpenClaw (the agent runtime), the backend (API + WebSocket), and the frontend (canvas UI).

### 1. OpenClaw (Docker)

OpenClaw runs as a Docker container. If you're already chatting with an OpenClaw agent, it's running. Otherwise:

```bash
# Pull and run OpenClaw (see https://docs.openclaw.ai for full setup)
docker run -d \
  --name openclaw \
  -p 18789:18789 \
  -v ~/.openclaw:/home/node/.openclaw \
  openclaw/openclaw:latest

# Verify it's running
docker ps | grep openclaw
```

OpenClaw mounts your `~/.openclaw` directory, which contains the workspace. The `company/` project lives at `~/.openclaw/workspace/company/`.

### 2. Backend (FastAPI)

```bash
cd ~/.openclaw/workspace/company/backend

# Install dependencies (first time only)
uv sync --extra dev

# Run the server
uv run uvicorn app.main:app --reload --port 8000
```

The backend serves:
- **REST API** at `http://localhost:8000/api/` — agents, tasks, events CRUD
- **WebSocket** at `ws://localhost:8000/ws` — real-time canvas state sync
- **API docs** at `http://localhost:8000/docs` — auto-generated Swagger UI

### 3. Frontend (React + Vite)

```bash
cd ~/.openclaw/workspace/company/frontend

# Install dependencies (first time only)
npm install

# Run the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

The Vite dev server proxies `/api/*` and `/ws` to the backend at `localhost:8000`, so everything works through a single URL.

### All three at once

If you want a one-liner (run from the company directory):

```bash
cd ~/.openclaw/workspace/company

# Terminal 1: Backend
cd backend && uv sync --extra dev && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm install && npm run dev

# Terminal 3: OpenClaw is already running in Docker
```

## What You'll See

When you open `http://localhost:3000`:

- **Infinite canvas** — pan by dragging, zoom with scroll wheel
- **Agent nodes** — four demo agents (named after Radiohead albums), each with a role, status, and scope
- **Task cards** — three seeded tasks with priority colors
- **Connection lines** — dashed lines between agents and their claimed tasks
- **Event feed** — bottom-right, real-time stream of commits, reverts, gate results
- **Detail sidebar** — click an agent to see stats, scope, branch, current task
- **HUD** — top-left, shows agent/task count and zoom level

## API Quick Reference

```bash
# Get full canvas state
curl http://localhost:8000/api/canvas

# List agents
curl http://localhost:8000/api/agents

# Create an agent
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "in-rainbows", "role": "implementer", "owned_paths": ["src/ui/"], "x": 400, "y": 0}'

# Create a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Build login page", "priority": 1, "x": 400, "y": 100}'

# Claim a task
curl -X POST http://localhost:8000/api/tasks/{task_id}/claim \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "AGENT_ID"}'

# Record a commit
curl -X POST http://localhost:8000/api/events/commit \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "AGENT_ID", "sha": "abc1234", "message": "feat: add login form"}'
```

## Architecture

```
company/
├── project.yaml               gates definition (immutable eval)
├── README.md
│
├── backend/                   FastAPI (Python)
│   ├── pyproject.toml         dependencies (managed by uv)
│   ├── app/
│   │   ├── main.py            app entry + demo seed data
│   │   ├── api/
│   │   │   ├── routes.py      REST endpoints
│   │   │   └── websocket.py   real-time canvas sync
│   │   ├── models/
│   │   │   ├── agent.py       roles, status, scope, position
│   │   │   ├── task.py        priority, assignment, lifecycle
│   │   │   ├── event.py       commit, revert, gate pass/fail
│   │   │   └── canvas.py      viewport, positioning
│   │   └── services/
│   │       └── state.py       in-memory CompanyState
│   └── tests/
│       └── test_state.py      state service tests
│
└── frontend/                  React + Vite + Tailwind
    ├── package.json
    ├── tailwind.config.js     Radiohead palette (parchment + blood)
    ├── vite.config.ts         dev server + API proxy
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── Canvas.tsx     infinite canvas (pan/zoom/grid)
        │   ├── AgentNode.tsx  agent cards with status pulse
        │   ├── TaskNode.tsx   task cards with priority color
        │   ├── Sidebar.tsx    detail panel on agent select
        │   └── EventFeed.tsx  real-time event stream
        ├── hooks/
        │   └── useWebSocket.ts
        ├── stores/
        │   ├── useCanvasStore.ts  pan/zoom state
        │   └── useAgentStore.ts   agents/tasks/events
        └── theme/
            └── colors.ts     status colors, role icons
```
