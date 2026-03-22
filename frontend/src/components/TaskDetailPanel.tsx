import { useState } from 'react'
import { useAgentStore } from '../stores/useAgentStore'
import { PRIORITY_COLORS } from '../theme/colors'

const PRIORITY_LABELS: Record<number, string> = {
  0: 'P0 · critical',
  1: 'P1 · high',
  2: 'P2 · medium',
  3: 'P3 · low',
  4: 'P4 · backlog',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-parchment-200 text-parchment-600',
  claimed: 'bg-blood/10 text-blood',
  in_progress: 'bg-blood/10 text-blood',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
  discarded: 'bg-parchment-100 text-parchment-400',
}

export function TaskDetailPanel() {
  const tasks = useAgentStore((s) => s.tasks)
  const agents = useAgentStore((s) => s.agents)
  const projects = useAgentStore((s) => s.projects)
  const selectedTaskId = useAgentStore((s) => s.selectedTaskId)
  const selectTask = useAgentStore((s) => s.selectTask)

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(2)
  const [saving, setSaving] = useState(false)

  const task = tasks.find((t) => t.id === selectedTaskId)
  if (!task) return null

  const assignedAgent = task.assigned_agent_id
    ? agents.find((a) => a.id === task.assigned_agent_id)
    : null
  const project = task.project_id
    ? projects.find((p) => p.id === task.project_id)
    : null
  const priorityLabel = PRIORITY_LABELS[task.priority] || `P${task.priority}`
  const priorityBorder = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[2]
  const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.open

  const startEdit = () => {
    setTitle(task.title)
    setDescription(task.description)
    setPriority(task.priority)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority }),
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="
      fixed top-0 right-0 w-80 h-full
      bg-parchment-50/95 backdrop-blur-sm
      border-l border-parchment-300
      z-50 flex flex-col
    ">
      {/* Header */}
      <div className="px-4 py-3 border-b border-parchment-300 flex items-center justify-between">
        <h2 className="font-typewriter text-sm text-parchment-600">task</h2>
        <button
          onClick={() => selectTask(null)}
          className="text-parchment-400 hover:text-parchment-700 text-lg px-1"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {editing ? (
          /* Edit mode */
          <div className="space-y-3">
            <div>
              <label className="font-typewriter text-xs text-parchment-500 block mb-1">title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm font-mono px-2 py-1.5 border border-parchment-300 rounded
                  focus:outline-none focus:border-blood/50"
              />
            </div>

            <div>
              <label className="font-typewriter text-xs text-parchment-500 block mb-1">description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full text-sm font-mono px-2 py-1.5 border border-parchment-300 rounded resize-y
                  focus:outline-none focus:border-blood/50"
              />
            </div>

            <div>
              <label className="font-typewriter text-xs text-parchment-500 block mb-1">priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full text-xs font-mono px-2 py-1.5 border border-parchment-300 rounded
                  focus:outline-none focus:border-blood/50 bg-white"
              >
                <option value={0}>P0 — critical</option>
                <option value={1}>P1 — high</option>
                <option value={2}>P2 — medium</option>
                <option value={3}>P3 — low</option>
                <option value={4}>P4 — backlog</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="text-xs font-mono px-3 py-1 rounded
                  bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
              >
                cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-xs font-mono px-3 py-1 rounded
                  bg-blood text-white hover:bg-blood/80 disabled:opacity-50"
              >
                {saving ? 'saving...' : 'save'}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <>
            {/* Title */}
            <div className={`border-l-4 ${priorityBorder} pl-3 mb-4`}>
              <h3 className="font-typewriter text-base font-bold text-parchment-800 leading-tight">
                {task.title}
              </h3>
            </div>

            {/* Status + Priority */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusStyle}`}>
                {task.status}
              </span>
              <span className="text-xs font-mono text-parchment-500">
                {priorityLabel}
              </span>
            </div>

            {/* Description */}
            {task.description ? (
              <div className="mb-4">
                <h4 className="font-typewriter text-xs text-parchment-500 mb-1">description</h4>
                <p className="text-sm text-parchment-700 leading-relaxed">
                  {task.description}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <span className="text-xs font-mono text-parchment-400 italic">no description</span>
              </div>
            )}

            {/* Assignment */}
            <div className="mb-4">
              <h4 className="font-typewriter text-xs text-parchment-500 mb-1">assigned to</h4>
              {assignedAgent ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-parchment-800">{assignedAgent.name}</span>
                  <span className="text-xs font-mono text-parchment-400">{assignedAgent.role}</span>
                  {assignedAgent.status === 'working' && assignedAgent.current_task_id === task.id && (
                    <svg className="animate-spin h-3 w-3 text-blood/50" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-60" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              ) : (
                <span className="text-xs font-mono text-parchment-400 italic">unassigned</span>
              )}
            </div>

            {/* Project */}
            {project && (
              <div className="mb-4">
                <h4 className="font-typewriter text-xs text-parchment-500 mb-1">project</h4>
                <span className="font-mono text-sm text-parchment-800">{project.name}</span>
              </div>
            )}

            {/* ID */}
            <div className="mb-4">
              <h4 className="font-typewriter text-xs text-parchment-500 mb-1">id</h4>
              <span className="font-mono text-xs text-parchment-400">{task.id}</span>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-parchment-200 flex items-center gap-2">
              <button
                onClick={startEdit}
                className="text-xs font-mono px-3 py-1 rounded
                  bg-parchment-200 text-parchment-600 hover:bg-parchment-300 transition-colors"
              >
                edit
              </button>
              {(task.status === 'open' || task.status === 'claimed') && (
                <button
                  onClick={async () => {
                    await fetch(`/api/tasks/${task.id}/run`, { method: 'POST' })
                  }}
                  className="text-xs font-mono px-3 py-1 rounded
                    bg-blood text-white hover:bg-blood/80
                    flex items-center gap-1 transition-colors"
                >
                  ▶ run
                </button>
              )}
              <button
                onClick={async () => {
                  await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
                  selectTask(null)
                }}
                className="text-xs font-mono px-3 py-1 rounded
                  text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300
                  transition-colors"
              >
                delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
