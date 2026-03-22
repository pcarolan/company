# Company

A single system for building software with agent teams.

**OpenClaw** is the interface — you talk to it. **The canvas** is the visualization — you watch agents work. **Plans** are the control plane — you write what needs building, agents execute it.

One container. One system.

## How It Works

1. **Create a project** — gets its own GitHub repo automatically
2. **Write a plan** — structured markdown with priorities and agent assignments
3. **Run the plan** — agents claim tasks, enter the autonomous-dev loop
4. **Watch the canvas** — agents working, messages flying, commits landing, costs accruing
5. You watch. Or sleep. They keep going.

## Concepts

### Projects
A project is a body of work. It has a GitHub repo, agents, and one or more plans. Cost tracks automatically per project and per agent.

### Plans
Plans are the unit of execution. A project can have many plans, each with a lifecycle:

```
draft → proposed → approved → active → completed
                                ↓
                           superseded (when a newer plan activates)
```

Plans generate tasks. You run plans, not projects.

### Agents
Each agent is a full OpenClaw instance with its own identity:
- **soul.md** — who they are (personality, boundaries)
- **program.md** — how they work (inherited from project + role-specific additions)
- **memory.md** — what they remember (accumulates over time)
- **daily notes** — raw logs per session

Agent roles: implementer, tester, architect, reviewer, planner, integrator, scout.

### Tasks
Tasks belong to plans and projects. Click to view, edit, run, or delete. Tasks link to their commits and diffs on GitHub.

### Program Inheritance
Every agent inherits the base [program.md](program.md) — the autonomous-dev loop, six principles, tools, scope constraints. Role-specific additions layer on top:
- **Implementers** follow the base loop with domain focus rules
- **Testers** override the loop — they write the gates, not the code
- **Architects** extend the loop — they design and review, not implement
- **Planners** write plans from goals, structured as P0–P4 task lists

## Stack

- **Runtime:** OpenClaw (agent orchestration, chat interface)
- **Backend:** FastAPI (Python) — state, WebSocket, orchestration, git
- **Frontend:** React + Vite + Tailwind — infinite canvas UI
- **Design:** parchment, typewriter, muted reds
- **All in one container**

## Run

### Dev Mode (recommended)

```bash
./dev.sh
```

Backend + frontend with hot reload. Edit any file, see changes instantly:
- **Python** → uvicorn auto-restarts (~1s)
- **React/CSS** → Vite HMR (instant, no page refresh)

Canvas at **http://localhost:3000**

### Docker Dev (with volume mounts)

```bash
docker compose -f docker-compose.dev.yml up
```

Same hot reload, but containerized. Source mounted as volumes.

### Docker (production)

```bash
docker build -t company .
docker run -p 8000:8000 company
```

Canvas + API at **http://localhost:8000**

### Entrypoints

| Command | What it runs | Port |
|---|---|---|
| `docker run company` | All services (default) | 8000 |
| `docker run company backend` | Backend only | 8000 |
| `docker run company frontend-dev` | Vite dev server | 3000 |

## API

### Projects

```bash
GET    /api/projects
POST   /api/projects                    # auto-creates GitHub repo
GET    /api/projects/{id}
PUT    /api/projects/{id}/status
POST   /api/projects/{id}/init-repo     # create repo for existing project
GET    /api/projects/{id}/cost          # cost breakdown with per-agent
GET    /api/projects/{id}/program       # base program.md
PUT    /api/projects/{id}/program
```

### Plans

```bash
GET    /api/projects/{id}/plans         # list plans for a project
POST   /api/projects/{id}/plans         # create plan {"name": "v1", "content": "..."}
GET    /api/plans/{id}
PUT    /api/plans/{id}/content          # edit plan content
PUT    /api/plans/{id}/status           # draft/proposed/approved/active/completed/rejected
POST   /api/plans/{id}/generate-tasks   # parse plan into tasks
POST   /api/plans/{id}/run              # execute the plan
POST   /api/plans/{id}/stop             # stop execution
GET    /api/plans/{id}/running          # check if running
```

### Agents

```bash
GET    /api/agents
POST   /api/agents                      # with soul + program
GET    /api/agents/{id}
PUT    /api/agents/{id}/status
PUT    /api/agents/{id}/thinking
GET    /api/agents/{id}/identity        # all identity files at once
GET    /api/agents/{id}/soul            # view soul.md
PUT    /api/agents/{id}/soul            # edit soul.md
GET    /api/agents/{id}/memory          # view memory.md
PUT    /api/agents/{id}/memory          # edit memory.md
GET    /api/agents/{id}/program         # view program.md
PUT    /api/agents/{id}/program         # edit program.md
GET    /api/agents/{id}/notes           # list daily note dates
GET    /api/agents/{id}/notes/{date}    # view a daily note
PUT    /api/agents/{id}/notes/{date}    # edit a daily note
```

### Tasks

```bash
GET    /api/tasks
POST   /api/tasks                       # {"title": "...", "project_id": "..."}
GET    /api/projects/{id}/tasks
POST   /api/projects/{id}/tasks/create
PUT    /api/tasks/{id}                  # edit title, description, priority, status
DELETE /api/tasks/{id}
POST   /api/tasks/{id}/run             # run single task, optional {"agent_id": "..."}
POST   /api/tasks/{id}/claim
POST   /api/tasks/{id}/close
```

### Events + Cost

```bash
GET    /api/events
POST   /api/events/commit
POST   /api/events/revert
POST   /api/events/gate
POST   /api/events/message
POST   /api/cost                        # record OpenRouter API call cost
```

### WebSocket

```
ws://localhost:8000/ws
```

Pushes real-time canvas state on every change. Handles `canvas_update`, `agent_moved`, `agent_thinking`, `agent_message` events.

## Plan Format

```markdown
# project-name

What we're building and why.

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
- Tasks are generated from plans, not written directly

## Environment

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | GitHub personal access token (repo creation + push) |
| `GITHUB_ORG` | Optional: create repos under an org |
| `COMPANY_REPOS_DIR` | Where local clones live (default `/tmp/company-repos`) |

## Built On

- [program.md](program.md) — the autonomous-dev philosophy
- [autonomous-dev](https://github.com/pcarolan/radiohead/tree/master/skills/autonomous-dev) — the agent workflow skill
- No framework. Markdown is the control plane.
