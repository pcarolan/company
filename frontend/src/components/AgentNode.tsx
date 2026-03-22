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
      {/* Working pulse ring */}
      {isWorking && (
        <div className="absolute -inset-1 rounded-xl border-2 border-blood/40 animate-ping pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="font-typewriter text-sm font-bold truncate">
          {agent.name}
        </span>
        {/* Live indicator dot */}
        {isWorking && (
          <span className="ml-auto relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blood" />
          </span>
        )}
      </div>

      {/* Role + Status */}
      <div className="flex items-center justify-between text-xs text-parchment-600">
        <span className="font-mono">{agent.role}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${
          agent.status === 'working' ? 'bg-blood/20 text-blood' :
          agent.status === 'stuck' ? 'bg-red-200 text-red-700' :
          'bg-parchment-300 text-parchment-700'
        }`}>
          {agent.status}
        </span>
      </div>

      {/* Thinking indicator */}
      {agent.thinking && (
        <div className="mt-2 flex items-start gap-1.5">
          <span className="text-xs animate-pulse">💭</span>
          <span className="text-xs font-mono text-parchment-600 italic leading-tight line-clamp-2">
            {agent.thinking}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-2 flex gap-3 text-xs font-mono text-parchment-500">
        <span title="commits">↑{agent.commits}</span>
        <span title="reverts">↩{agent.reverts}</span>
        {agent.branch && (
          <span title="branch" className="truncate text-blood-dim">
            ⎇ {agent.branch}
          </span>
        )}
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
