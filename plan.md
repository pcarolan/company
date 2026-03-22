# company

A single system for building software with agent teams. OpenClaw is the interface. The canvas is the visualization. plan.md is the control plane.

You talk to it through OpenClaw. It shows you what's happening on the canvas. Agents are real — they run via OpenClaw's sessions_spawn, execute program.md workflows, and report back. The canvas renders their work in real time.

One container. One system. The company app IS the company.

## Architecture

- **OpenClaw** — the agent runtime and human interface (chat, commands, cron)
- **Backend (FastAPI)** — state management, WebSocket, agent orchestration
- **Frontend (React)** — infinite canvas UI, served by the backend
- **All in one Docker container** — OpenClaw + backend + frontend

OpenClaw spawns agents. Agents execute program.md. The backend tracks state. The frontend renders the canvas. The human talks to OpenClaw and watches the canvas.

## P0
- [ ] Single Docker container runs OpenClaw + FastAPI + frontend
- [ ] Backend serves the built frontend as static files
- [ ] OpenClaw skill triggers agent spawning for projects
- [ ] Agent lifecycle: spawn → claim task → enter loop → commit → report → next task
- [ ] Canvas connects to backend WebSocket for real-time state
- [ ] plan.md loaded from project repo, parsed into tasks on project create

## P1
- [ ] OpenClaw command: "create project <name>" → creates project + repo + plan.md
- [ ] OpenClaw command: "start project <name>" → spawns agents per plan, sets status active
- [ ] OpenClaw command: "show me <project>" → opens canvas focused on that project
- [ ] Agent reports: commits, reverts, gate results pushed to backend via internal API
- [ ] Agent-to-agent messaging routed through OpenClaw sessions_send
- [ ] Canvas auto-updates as agents work — no manual refresh

## P2
- [ ] Persistent storage — SQLite for state across restarts
- [ ] Git integration — agents push to real repos, canvas shows branch/commit history
- [ ] Plan editor — edit plan.md from the canvas sidebar, regenerate tasks
- [ ] Gate runner — trigger gates from canvas, show pass/fail live
- [ ] Agent program viewer — see an agent's program.md on the canvas
- [ ] Drag to reposition agents/tasks on canvas

## P3
- [ ] Multi-project canvas — run multiple projects simultaneously
- [ ] Timeline view — horizontal axis showing commits/events over time
- [ ] Cost tracking — tokens used per agent, cost per project
- [ ] Role-based auto-layout — architect top, implementers middle, tester bottom
- [ ] Structured agent communication — request/response/handoff message types

## P4
- [ ] Multi-user — multiple humans watching the same canvas
- [ ] Auth + permissions — who can create/start/stop projects
- [ ] Mobile canvas — responsive for tablet
- [ ] Plugin system — custom agent roles, custom visualizations
- [ ] Export — canvas snapshot as PNG, plan + tasks as markdown report
