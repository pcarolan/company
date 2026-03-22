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

## Run Locally (Dev Mode)

Until the single-container build is ready, run the pieces separately:

```bash
# OpenClaw — already running in Docker
# (it's how you're reading this)

# Backend
cd backend
uv sync --extra dev
uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Canvas at **http://localhost:3000**

## Built On

- [autonomous-dev](https://github.com/pcarolan/radiohead/tree/master/skills/autonomous-dev) — the agent workflow
- [program.md](https://github.com/pcarolan/radiohead/blob/master/program.md) — the philosophy
- No framework. Markdown is the control plane.
