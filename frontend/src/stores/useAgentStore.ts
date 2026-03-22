import { create } from 'zustand'

export interface AgentNode {
  id: string
  name: string
  role: string
  status: string
  x: number
  y: number
  branch: string | null
  owned_paths: string[]
  current_task_id: string | null
  last_commit: string | null
  commits: number
  reverts: number
  thinking: string | null
}

export interface AgentMessage {
  id: string
  from_id: string
  to_id: string
  from_name: string
  to_name: string
  text: string
  timestamp: number  // Date.now()
}

export interface TaskNode {
  id: string
  title: string
  description: string
  status: string
  priority: number
  assigned_agent_id: string | null
  x: number
  y: number
}

export interface ProjectNode {
  id: string
  name: string
  description: string
  status: string
  repo: string | null
  branch: string | null
  agent_ids: string[]
  task_ids: string[]
  x: number
  y: number
  width: number
  height: number
  gates: Record<string, string>
  program_file: string
}

export interface EventItem {
  id: string
  type: string
  agent_id: string
  task_id: string | null
  message: string
  timestamp: string
}

interface AgentStoreState {
  agents: AgentNode[]
  tasks: TaskNode[]
  projects: ProjectNode[]
  events: EventItem[]
  messages: AgentMessage[]
  selectedId: string | null

  setCanvas: (agents: AgentNode[], tasks: TaskNode[], events: EventItem[], projects?: ProjectNode[]) => void
  moveAgent: (id: string, x: number, y: number) => void
  updateAgent: (id: string, updates: Partial<AgentNode>) => void
  addEvent: (event: EventItem) => void
  addMessage: (msg: AgentMessage) => void
  select: (id: string | null) => void
}

export const useAgentStore = create<AgentStoreState>((set) => ({
  agents: [],
  tasks: [],
  projects: [],
  events: [],
  messages: [],
  selectedId: null,

  setCanvas: (agents, tasks, events, projects) => set({ agents, tasks, events, projects: projects || [] }),

  moveAgent: (id, x, y) => set((s) => ({
    agents: s.agents.map((a) => a.id === id ? { ...a, x, y } : a),
  })),

  updateAgent: (id, updates) => set((s) => ({
    agents: s.agents.map((a) => a.id === id ? { ...a, ...updates } : a),
  })),

  addEvent: (event) => set((s) => ({
    events: [...s.events.slice(-99), event],
  })),

  addMessage: (msg) => set((s) => ({
    // keep last 20 messages, expire after 10 seconds handled in component
    messages: [...s.messages.slice(-19), msg],
  })),

  select: (id) => set({ selectedId: id }),
}))
