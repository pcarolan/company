import { AgentNode as AgentData } from '../stores/useAgentStore'
import { STATUS_COLORS, ROLE_ICONS } from '../theme/colors'

interface Props {
  agent: AgentData
  selected: boolean
  onSelect: () => void
}

export function AgentNode({ agent, selected, onSelect }: Props) {
  const style = STATUS_COLORS[agent.status] || STATUS_COLORS.idle
  const icon = ROLE_ICONS[agent.role] || '●'
  const isWorking = agent.status === 'working'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      className={`
        absolute select-none cursor-pointer
        w-48 rounded-lg border-2 p-3
        transition-all duration-200
        ${style.bg} ${style.border}
        ${selected ? 'ring-2 ring-blood shadow-lg scale-105' : 'hover:shadow-md'}
      `}
      style={{
        left: agent.x,
        top: agent.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Working spinner ring — subtle rotating border */}
      {isWorking && (
        <div
          className="absolute -inset-1 rounded-xl pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 70%, rgba(139,0,0,0.25) 100%)',
            animation: 'spin 2s linear infinite',
            WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
            maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="font-typewriter text-sm font-bold truncate">
          {agent.name}
        </span>
        {/* Spinner dot */}
        {isWorking && (
          <span className="ml-auto flex h-3 w-3 items-center justify-center">
            <svg className="animate-spin h-3 w-3 text-blood/60" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-70" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {/* Role + Status */}
      <div className="flex items-center justify-between text-xs text-parchment-600">
        <span className="font-mono">{agent.role}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${
          agent.status === 'working' ? 'bg-blood/10 text-blood/70' :
          agent.status === 'stuck' ? 'bg-red-200 text-red-700' :
          'bg-parchment-300 text-parchment-700'
        }`}>
          {agent.status}
        </span>
      </div>

      {/* Thinking indicator */}
      {agent.thinking && (
        <div className="mt-2 flex items-start gap-1.5">
          <span className="text-xs text-parchment-400">›</span>
          <span className="text-xs font-mono text-parchment-500 italic leading-tight line-clamp-2">
            {agent.thinking}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-2 flex gap-3 text-xs font-mono text-parchment-500">
        <span title="commits">↑{agent.commits}</span>
        <span title="reverts">↩{agent.reverts}</span>
        {agent.cost_usd > 0 && (
          <span title="cost" className="text-amber-600">
            ${agent.cost_usd < 1 ? agent.cost_usd.toFixed(2) : agent.cost_usd.toFixed(0)}
          </span>
        )}
        {agent.branch && (
          <span title="branch" className="truncate text-blood-dim">
            ⎇ {agent.branch}
          </span>
        )}
      </div>

      {/* Identity indicators */}
      <div className="mt-1 flex gap-1">
        {agent.has_soul && <span className="text-xs opacity-60" title="has soul.md">🪬</span>}
        {agent.has_program && <span className="text-xs opacity-60" title="has program.md">📋</span>}
        {agent.has_memory && <span className="text-xs opacity-60" title="has memory.md">🧠</span>}
        {agent.daily_note_count > 0 && <span className="text-xs opacity-60" title={`${agent.daily_note_count} daily notes`}>📝</span>}
        {agent.session_id && <span className="text-xs" title="live session">🟢</span>}
      </div>

      {/* Scope */}
      {agent.owned_paths.length > 0 && (
        <div className="mt-1 text-xs font-mono text-parchment-400 truncate">
          {agent.owned_paths.join(', ')}
        </div>
      )}
    </div>
  )
}
