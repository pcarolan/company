import { useState } from 'react'
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
  const [activeTab, setActiveTab] = useState<Tab>('plan')

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  return (
    <div className="
      fixed top-0 left-0 w-72 h-full
      bg-parchment-50/95 backdrop-blur-sm
      border-r border-parchment-300
      z-50 flex flex-col
    ">
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
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blood" />
                      </span>
                      <span className="font-mono text-blood">{workingCount}</span>
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
          {/* Description */}
          {selectedProject.description && (
            <div className="px-4 py-2 border-b border-parchment-200 flex-shrink-0">
              <p className="text-xs text-parchment-600">{selectedProject.description}</p>
            </div>
          )}

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

                {selectedProject.plan ? (
                  <pre className="text-xs font-mono text-parchment-700 whitespace-pre-wrap leading-relaxed">
                    {selectedProject.plan}
                  </pre>
                ) : (
                  <p className="text-xs font-mono text-parchment-400 italic">
                    no plan yet — set one via the API
                  </p>
                )}

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
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blood" />
                                </span>
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
                          className={`
                            px-2 py-1.5 rounded border border-parchment-300 border-l-4 ${priorityBorder}
                            bg-parchment-50
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
