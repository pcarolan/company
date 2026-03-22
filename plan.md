# company

An app that both IS and REPRESENTS an agent-powered company. Agents live on an infinite canvas. You see them work, talk, commit, revert, and ship. The human programs the organization — the agents execute.

## P0
- [ ] Backend API serves agents, tasks, projects, events via REST + WebSocket
- [ ] Frontend renders infinite canvas with pan/zoom
- [ ] Agent nodes show role, status, scope, commit/revert counts
- [ ] Task nodes show priority, status, assignment
- [ ] Project regions group agents and tasks visually on canvas
- [ ] WebSocket syncs all state changes to connected clients in real time
- [ ] Project sidebar lists projects, drills into plan/agents/tasks

## P1
- [ ] Plan.md is the source of truth — generates tasks with priority and auto-assignment
- [ ] Working indicator: pulsing dot + ring when agent status is working
- [ ] Thinking bubble: shows what agent is currently doing
- [ ] Agent-to-agent messaging: animated lines on canvas with message text, fades after 8s
- [ ] Event feed: real-time stream of commits, reverts, gate results, messages
- [ ] Agent detail sidebar: click agent on canvas to see full stats, scope, thinking, task
- [ ] Seed data: demo project with agents and tasks generated from plan

## P2
- [ ] Persistent storage — replace in-memory state with SQLite or Postgres
- [ ] Git integration — each agent gets a real branch, commits tracked from actual repos
- [ ] Plan editor in sidebar — edit plan.md in-app, regenerate tasks on save
- [ ] Drag agents and tasks on canvas — persist positions via WebSocket
- [ ] Connection lines between agents in the same project (not just agent→task)
- [ ] Gate runner — trigger project gates from the UI, show pass/fail per agent
- [ ] Agent log panel — scrollable history of an agent's events/commits

## P3
- [ ] OpenClaw integration — spawn real agents via sessions_spawn, bind to canvas nodes
- [ ] Agent program viewer — click agent to see its program.md in a panel
- [ ] Multi-project canvas — multiple projects on one canvas, zoom to fit
- [ ] Project timeline — horizontal time axis showing commits/events over time
- [ ] Agent communication protocol — structured message types (request, response, handoff)
- [ ] Role-based auto-layout — architect at top, implementers middle, tester bottom
- [ ] Dark mode toggle (keep parchment as default)

## P4
- [ ] Deploy to production — Docker compose for backend + frontend + OpenClaw
- [ ] Auth — user accounts, project ownership, agent permissions
- [ ] Multi-user canvas — multiple humans watching the same canvas in real time
- [ ] Mobile layout — responsive canvas for tablet/phone
- [ ] Plugin system — custom agent roles, custom event types, custom visualizations
- [ ] Metrics dashboard — cost per agent, tokens used, commits/hour, success rate
- [ ] Export — snapshot canvas as PNG/SVG, export plan + tasks as markdown
