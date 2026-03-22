import { useState, useCallback, useRef } from 'react'
import { useAgentStore, type AgentNode } from '../stores/useAgentStore'
import { ROLE_ICONS, STATUS_COLORS, PRIORITY_COLORS } from '../theme/colors'

function formatCost(usd: number): string {
  if (usd === 0) return '$0'
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  if (usd < 1) return `$${usd.toFixed(2)}`
  return `$${usd.toFixed(2)}`
}

function formatTokens(n: number): string {
  if (n === 0) return '0'
  if (n < 1000) return `${n}`
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: 'text-parchment-500',
  active: 'text-blood',
  paused: 'text-amber-600',
  completed: 'text-green-600',
  archived: 'text-parchment-400',
}

type Tab = 'plan' | 'agents' | 'tasks'

export function ProjectSidebar() {
  const projects = useAgentStore((s) => s.projects)
  const agents = useAgentStore((s) => s.agents)
  const tasks = useAgentStore((s) => s.tasks)
  const selectedProjectId = useAgentStore((s) => s.selectedProjectId)
  const selectProject = useAgentStore((s) => s.selectProject)
  const selectTask = useAgentStore((s) => s.selectTask)
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const plans = useAgentStore((s) => s.plans)
  const [width, setWidth] = useState(288) // 18rem = 288px
  const [runLoading, setRunLoading] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      setWidth(Math.max(200, Math.min(600, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [width])
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planDraft, setPlanDraft] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')

  const handleRun = useCallback(async (projectId: string) => {
    setRunLoading(true)
    try {
      await fetch(`/api/projects/${projectId}/run`, { method: 'POST' })
    } catch (e) {
      console.error('Failed to start project', e)
    }
    setRunLoading(false)
  }, [])

  const handleStop = useCallback(async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/stop`, { method: 'POST' })
    } catch (e) {
      console.error('Failed to stop project', e)
    }
  }, [])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div
      className="
        fixed top-0 left-0 h-full
        bg-parchment-50/95 backdrop-blur-sm
        border-r border-parchment-300
        z-50 flex flex-col
      "
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="
          absolute top-0 right-0 w-1 h-full cursor-col-resize z-10
          hover:bg-blood/20 active:bg-blood/30 transition-colors
        "
      />
      {/* Header */}
      <div className="px-4 py-3 border-b border-parchment-300">
        <h2 className="font-typewriter text-sm text-parchment-600">projects</h2>
      </div>

      {/* Project list */}
      <div className="flex-shrink-0 border-b border-parchment-200">
        {projects.length === 0 ? (
          <div className="px-4 py-3 text-xs font-mono text-parchment-400">no projects</div>
        ) : (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId
            const statusColor = PROJECT_STATUS_COLORS[project.status] || PROJECT_STATUS_COLORS.planning
            const projectTasks = tasks.filter((t) => t.project_id === project.id)
            const workingCount = project.agent_ids.filter((aid) => {
              const a = agents.find((ag) => ag.id === aid)
              return a?.status === 'working'
            }).length

            return (
              <button
                key={project.id}
                onClick={(e) => {
                  e.stopPropagation()
                  selectProject(isSelected ? null : project.id)
                }}
                className={`
                  w-full text-left px-4 py-2.5 border-b border-parchment-100
                  transition-colors duration-150
                  ${isSelected
                    ? 'bg-blood/5 border-l-2 border-l-blood'
                    : 'hover:bg-parchment-200/50 border-l-2 border-l-transparent'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-typewriter text-sm truncate">{project.name}</span>
                  {workingCount > 0 && (
                    <span className="flex items-center gap-1 text-xs">
                      <svg className="animate-spin h-3 w-3 text-blood/50" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-60" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span className="font-mono text-blood/60">{workingCount}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-mono ${statusColor}`}>{project.status}</span>
                  <span className="text-xs text-parchment-400 font-mono">
                    {project.agent_ids.length}a · {projectTasks.length}t
                  </span>
                  {project.cost_usd > 0 && (
                    <span className="text-xs font-mono text-amber-600 ml-auto">
                      {formatCost(project.cost_usd)}
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Project detail */}
      {selectedProject ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Description + Repo */}
          <div className="px-4 py-2 border-b border-parchment-200 flex-shrink-0">
            {selectedProject.description && (
              <p className="text-xs text-parchment-600 mb-1">{selectedProject.description}</p>
            )}
            {selectedProject.repo ? (
              <a
                href={selectedProject.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blood hover:underline flex items-center gap-1"
              >
                <span>⎇</span> {selectedProject.repo.replace('https://github.com/', '')}
              </a>
            ) : (
              <span className="text-xs font-mono text-parchment-400 italic">no repo</span>
            )}

            {/* Run / Stop button */}
            <div className="mt-2">
              {selectedProject.status === 'active' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStop(selectedProject.id) }}
                  className="
                    w-full py-2 rounded font-typewriter text-sm
                    bg-parchment-200 text-parchment-700 border border-parchment-300
                    hover:bg-parchment-300 transition-colors
                    flex items-center justify-center gap-2
                  "
                >
                  <span>■</span> stop
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRun(selectedProject.id) }}
                  disabled={runLoading}
                  className="
                    w-full py-2 rounded font-typewriter text-sm
                    bg-blood text-white border border-blood
                    hover:bg-blood/80 transition-colors
                    disabled:opacity-50
                    flex items-center justify-center gap-2
                  "
                >
                  {runLoading ? (
                    <span className="animate-pulse">starting...</span>
                  ) : (
                    <>
                      <span>▶</span> run project
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-parchment-200 flex-shrink-0">
            {(['plan', 'agents', 'tasks'] as Tab[]).map((tab) => {
              const count = tab === 'agents'
                ? selectedProject.agent_ids.length
                : tab === 'tasks'
                  ? tasks.filter((t) => t.project_id === selectedProject.id).length
                  : null
              return (
                <button
                  key={tab}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab) }}
                  className={`
                    flex-1 py-2 text-xs font-typewriter transition-colors
                    ${activeTab === tab
                      ? 'text-blood border-b-2 border-blood'
                      : 'text-parchment-400 hover:text-parchment-600'
                    }
                  `}
                >
                  {tab}{count !== null ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* Plan tab */}
            {activeTab === 'plan' && (
              <div className="px-4 py-3">
                {/* Cost summary */}
                <div className="mb-4 p-3 rounded bg-parchment-100 border border-parchment-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-typewriter text-xs text-parchment-500">openrouter bill</h3>
                    <span className="font-mono text-sm font-bold text-amber-600">
                      {formatCost(selectedProject.cost_usd)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-mono text-xs text-parchment-400">calls</div>
                      <div className="font-mono text-sm text-parchment-700">{selectedProject.api_calls}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs text-parchment-400">prompt</div>
                      <div className="font-mono text-sm text-parchment-700">{formatTokens(selectedProject.tokens_prompt)}</div>
                    </div>
                    <div>
                      <div className="font-mono text-xs text-parchment-400">completion</div>
                      <div className="font-mono text-sm text-parchment-700">{formatTokens(selectedProject.tokens_completion)}</div>
                    </div>
                  </div>

                  {/* Per-agent cost breakdown */}
                  {(() => {
                    const agentCosts = selectedProject.agent_ids
                      .map((aid) => agents.find((a) => a.id === aid))
                      .filter((a): a is AgentNode => !!a && a.cost_usd > 0)
                      .sort((a, b) => b.cost_usd - a.cost_usd)
                    if (agentCosts.length === 0) return null
                    return (
                      <div className="mt-2 pt-2 border-t border-parchment-200 space-y-1">
                        {agentCosts.map((agent) => (
                          <div key={agent.id} className="flex items-center justify-between">
                            <span className="font-mono text-xs text-parchment-600 truncate">{agent.name}</span>
                            <span className="font-mono text-xs text-amber-600 shrink-0 ml-2">
                              {formatCost(agent.cost_usd)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* Plans list */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-typewriter text-xs text-parchment-500">plans</h3>
                    <button
                      onClick={() => setCreatingPlan(true)}
                      className="text-xs font-mono px-2 py-0.5 rounded
                        bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
                    >
                      + new plan
                    </button>
                  </div>

                  {/* New plan form */}
                  {creatingPlan && (
                    <div className="mb-2 p-2 border border-parchment-200 rounded bg-white/50 space-y-2">
                      <input
                        type="text"
                        placeholder="plan name (e.g. v2, phase-2)"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 border border-parchment-300 rounded
                          focus:outline-none focus:border-blood/50"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setCreatingPlan(false); setNewPlanName('') }}
                          className="text-xs font-mono px-2 py-0.5 rounded
                            bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
                        >
                          cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!newPlanName.trim()) return
                            await fetch(`/api/projects/${selectedProject.id}/plans`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newPlanName.trim() }),
                            })
                            setCreatingPlan(false)
                            setNewPlanName('')
                          }}
                          className="text-xs font-mono px-2 py-0.5 rounded
                            bg-blood text-white hover:bg-blood/80"
                        >
                          create
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Plan cards */}
                  {(() => {
                    const projectPlans = plans
                      .filter((p) => p.project_id === selectedProject.id)
                      .sort((a, b) => b.version - a.version)

                    if (projectPlans.length === 0 && !creatingPlan) {
                      return (
                        <p className="text-xs font-mono text-parchment-400 italic">
                          no plans yet
                        </p>
                      )
                    }

                    const PLAN_STATUS_COLORS: Record<string, string> = {
                      draft: 'bg-parchment-200 text-parchment-600',
                      proposed: 'bg-amber-100 text-amber-700',
                      approved: 'bg-blue-100 text-blue-700',
                      active: 'bg-blood/10 text-blood',
                      completed: 'bg-green-100 text-green-700',
                      rejected: 'bg-red-100 text-red-600',
                      superseded: 'bg-parchment-100 text-parchment-400',
                    }

                    return (
                      <div className="space-y-1.5">
                        {projectPlans.map((plan) => {
                          const isActive = plan.id === selectedProject.active_plan_id
                          const isEditing = editingPlanId === plan.id
                          const statusColor = PLAN_STATUS_COLORS[plan.status] || PLAN_STATUS_COLORS.draft

                          return (
                            <div key={plan.id} className={`
                              rounded border p-2
                              ${isActive ? 'border-blood/30 bg-blood/[0.02]' : 'border-parchment-200 bg-white/30'}
                            `}>
                              {/* Plan header */}
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-typewriter text-xs font-bold">{plan.name}</span>
                                  <span className="text-xs text-parchment-400 font-mono">v{plan.version}</span>
                                </div>
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${statusColor}`}>
                                  {plan.status}
                                </span>
                              </div>

                              {/* Author */}
                              <div className="text-xs font-mono text-parchment-400 mb-1">
                                by {plan.author_name} · {plan.task_ids.length} tasks
                              </div>

                              {/* Content / Editor */}
                              {isEditing ? (
                                <div className="space-y-2 mt-2">
                                  <textarea
                                    value={planDraft}
                                    onChange={(e) => setPlanDraft(e.target.value)}
                                    className="
                                      w-full min-h-[200px] font-mono text-xs text-parchment-800
                                      bg-white/80 border border-parchment-300 rounded p-2 resize-y
                                      focus:outline-none focus:border-blood/50
                                    "
                                    spellCheck={false}
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setEditingPlanId(null)}
                                      className="text-xs font-mono px-2 py-0.5 rounded
                                        bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
                                    >
                                      cancel
                                    </button>
                                    <button
                                      onClick={async () => {
                                        setSavingPlan(true)
                                        await fetch(`/api/plans/${plan.id}/content`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ content: planDraft }),
                                        })
                                        setSavingPlan(false)
                                        setEditingPlanId(null)
                                      }}
                                      disabled={savingPlan}
                                      className="text-xs font-mono px-2 py-0.5 rounded
                                        bg-blood text-white hover:bg-blood/80 disabled:opacity-50"
                                    >
                                      {savingPlan ? 'saving...' : 'save'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {plan.content && (
                                    <pre
                                      className="text-xs font-mono text-parchment-600 whitespace-pre-wrap leading-relaxed
                                        max-h-32 overflow-y-auto cursor-pointer hover:bg-parchment-50 rounded p-1 -mx-1 mt-1"
                                      onClick={() => { setPlanDraft(plan.content); setEditingPlanId(plan.id) }}
                                    >
                                      {plan.content}
                                    </pre>
                                  )}

                                  {/* Action buttons */}
                                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    <button
                                      onClick={() => { setPlanDraft(plan.content || ''); setEditingPlanId(plan.id) }}
                                      className="text-xs font-mono px-2 py-0.5 rounded
                                        bg-parchment-200 text-parchment-600 hover:bg-parchment-300"
                                    >
                                      edit
                                    </button>

                                    {plan.status === 'draft' && (
                                      <button
                                        onClick={async () => {
                                          await fetch(`/api/plans/${plan.id}/status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'proposed' }),
                                          })
                                        }}
                                        className="text-xs font-mono px-2 py-0.5 rounded
                                          bg-amber-100 text-amber-700 hover:bg-amber-200"
                                      >
                                        propose
                                      </button>
                                    )}

                                    {(plan.status === 'proposed' || plan.status === 'draft') && (
                                      <button
                                        onClick={async () => {
                                          await fetch(`/api/plans/${plan.id}/status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'approved' }),
                                          })
                                        }}
                                        className="text-xs font-mono px-2 py-0.5 rounded
                                          bg-blue-100 text-blue-700 hover:bg-blue-200"
                                      >
                                        approve
                                      </button>
                                    )}

                                    {(plan.status === 'approved' || plan.status === 'active') && plan.content && (
                                      <button
                                        onClick={async () => {
                                          await fetch(`/api/plans/${plan.id}/generate-tasks`, { method: 'POST' })
                                        }}
                                        className="text-xs font-mono px-2 py-0.5 rounded
                                          bg-green-100 text-green-700 hover:bg-green-200"
                                      >
                                        generate tasks
                                      </button>
                                    )}

                                    {!isActive && (plan.status === 'approved' || plan.status === 'active') && (
                                      <button
                                        onClick={async () => {
                                          await fetch(`/api/plans/${plan.id}/status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'active' }),
                                          })
                                        }}
                                        className="text-xs font-mono px-2 py-0.5 rounded
                                          bg-blood/10 text-blood hover:bg-blood/20"
                                      >
                                        activate
                                      </button>
                                    )}

                                    {isActive && (
                                      <span className="text-xs font-mono text-blood">● active</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Gates */}
                {Object.keys(selectedProject.gates).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-parchment-200">
                    <h3 className="font-typewriter text-xs text-parchment-500 mb-2">gates</h3>
                    <div className="space-y-1">
                      {Object.entries(selectedProject.gates).map(([name, cmd]) => (
                        <div key={name} className="flex items-start gap-2">
                          <span className="font-mono text-xs text-blood shrink-0">{name}</span>
                          <span className="font-mono text-xs text-parchment-500 truncate">{cmd}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agents tab */}
            {activeTab === 'agents' && (
              <div className="px-4 py-3">
                <div className="space-y-1.5">
                  {selectedProject.agent_ids.map((aid) => {
                    const agent = agents.find((a) => a.id === aid)
                    if (!agent) return null
                    const style = STATUS_COLORS[agent.status] || STATUS_COLORS.idle
                    const icon = ROLE_ICONS[agent.role] || '●'
                    const isWorking = agent.status === 'working'
                    const agentTasks = tasks.filter(
                      (t) => t.project_id === selectedProject.id && t.assigned_agent_id === agent.id
                    )

                    return (
                      <div
                        key={aid}
                        className={`
                          px-2 py-2 rounded
                          ${style.bg} border ${style.border}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-typewriter text-xs font-bold truncate">{agent.name}</span>
                              {isWorking && (
                                <svg className="animate-spin h-2.5 w-2.5 text-blood/50" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                  <path className="opacity-60" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                              )}
                            </div>
                            {agent.thinking ? (
                              <div className="text-xs font-mono text-parchment-500 italic truncate">
                                💭 {agent.thinking}
                              </div>
                            ) : (
                              <div className="text-xs font-mono text-parchment-400">
                                {agent.status} · ↑{agent.commits} ↩{agent.reverts}
                                {agent.cost_usd > 0 && (
                                  <span className="text-amber-600 ml-1">· {formatCost(agent.cost_usd)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Agent's tasks in this project */}
                        {agentTasks.length > 0 && (
                          <div className="mt-1.5 ml-7 space-y-0.5">
                            {agentTasks.map((t) => (
                              <div key={t.id} className="text-xs font-mono text-parchment-500 flex items-center gap-1">
                                <span className={
                                  t.status === 'done' ? 'text-green-600' :
                                  t.status === 'claimed' ? 'text-blood' :
                                  'text-parchment-400'
                                }>
                                  {t.status === 'done' ? '✓' : t.status === 'claimed' ? '→' : '○'}
                                </span>
                                <span className="truncate">{t.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tasks tab */}
            {activeTab === 'tasks' && (
              <div className="px-4 py-3">
                <div className="space-y-1.5">
                  {tasks
                    .filter((t) => t.project_id === selectedProject.id)
                    .sort((a, b) => a.priority - b.priority)
                    .map((task) => {
                      const priorityBorder = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[2]
                      const assignedAgent = task.assigned_agent_id
                        ? agents.find((a) => a.id === task.assigned_agent_id)
                        : null

                      return (
                        <div
                          key={task.id}
                          onClick={() => selectTask(task.id)}
                          className={`
                            px-2 py-1.5 rounded border border-parchment-300 border-l-4 ${priorityBorder}
                            bg-parchment-50 cursor-pointer hover:bg-parchment-100 transition-colors
                          `}
                        >
                          <div className="text-xs font-semibold text-parchment-800 truncate">
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono px-1 rounded ${
                                task.status === 'done' ? 'bg-green-100 text-green-700' :
                                task.status === 'claimed' || task.status === 'in_progress' ? 'bg-blood/10 text-blood' :
                                'bg-parchment-200 text-parchment-500'
                              }`}>
                                {task.status}
                              </span>
                              <span className="text-xs font-mono text-parchment-300">P{task.priority}</span>
                            </div>
                            {assignedAgent && (
                              <span className="text-xs font-mono text-parchment-400 truncate ml-1">
                                → {assignedAgent.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-xs font-mono text-parchment-400 text-center">
            select a project to see details
          </p>
        </div>
      )}
    </div>
  )
}
