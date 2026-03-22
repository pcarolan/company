import { useState } from 'react'
import { useAgentStore } from '../stores/useAgentStore'
import { ROLE_ICONS, STATUS_COLORS } from '../theme/colors'
import { AgentIdentityPanel } from './AgentIdentityPanel'

export function AgentSidebar() {
  const agents = useAgentStore((s) => s.agents)
  const selectedId = useAgentStore((s) => s.selectedId)
  const selected = agents.find((a) => a.id === selectedId)
  const [showIdentity, setShowIdentity] = useState(false)

  if (!selected) return null

  const style = STATUS_COLORS[selected.status] || STATUS_COLORS.idle
  const icon = ROLE_ICONS[selected.role] || '●'

  return (
    <>
      <div className="
        fixed top-0 right-0 w-80 h-full
        bg-parchment-50/95 backdrop-blur-sm
        border-l border-parchment-300
        p-4 z-50 overflow-y-auto
      ">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="font-typewriter text-lg">{selected.name}</h2>
            <span className="font-mono text-xs text-parchment-500">{selected.role}</span>
          </div>
        </div>

        {/* Status */}
        <div className={`
          inline-block px-2 py-1 rounded text-xs font-mono mb-4
          ${style.bg} ${style.border} border
        `}>
          {selected.status}
        </div>

        {/* Identity files */}
        <div className="mb-4 p-3 bg-parchment-100 border border-parchment-200 rounded">
          <h3 className="font-typewriter text-xs text-parchment-500 mb-2">openclaw instance</h3>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span>{selected.has_soul ? '✓' : '○'}</span>
              <span className={selected.has_soul ? 'text-parchment-700' : 'text-parchment-400'}>soul.md</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span>{selected.has_memory ? '✓' : '○'}</span>
              <span className={selected.has_memory ? 'text-parchment-700' : 'text-parchment-400'}>memory.md</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span>{selected.has_program ? '✓' : '○'}</span>
              <span className={selected.has_program ? 'text-parchment-700' : 'text-parchment-400'}>program.md</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span>{selected.daily_note_count > 0 ? '✓' : '○'}</span>
              <span className={selected.daily_note_count > 0 ? 'text-parchment-700' : 'text-parchment-400'}>
                notes ({selected.daily_note_count})
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowIdentity(true)}
            className="
              w-full text-xs font-mono px-3 py-1.5 rounded
              bg-blood/10 text-blood border border-blood/20
              hover:bg-blood/20 transition-colors
            "
          >
            view / edit identity →
          </button>
        </div>

        {/* Session */}
        {selected.session_id && (
          <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
            <h3 className="font-typewriter text-xs text-green-700 mb-1">live session</h3>
            <div className="font-mono text-xs text-green-600">{selected.session_id}</div>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-parchment-500">commits</span>
            <span className="font-mono">{selected.commits}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-parchment-500">reverts</span>
            <span className="font-mono">{selected.reverts}</span>
          </div>
          {selected.cost_usd > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-parchment-500">cost</span>
              <span className="font-mono text-amber-600">
                ${selected.cost_usd < 0.01 ? selected.cost_usd.toFixed(4) : selected.cost_usd.toFixed(2)}
              </span>
            </div>
          )}
          {selected.last_commit && (
            <div className="flex justify-between text-sm">
              <span className="text-parchment-500">last commit</span>
              <span className="font-mono text-xs">{selected.last_commit}</span>
            </div>
          )}
          {selected.branch && (
            <div className="flex justify-between text-sm">
              <span className="text-parchment-500">branch</span>
              <span className="font-mono text-xs text-blood-dim">{selected.branch}</span>
            </div>
          )}
        </div>

        {/* Scope */}
        {selected.owned_paths.length > 0 && (
          <div className="mb-4">
            <h3 className="font-typewriter text-xs text-parchment-500 mb-1">scope</h3>
            <div className="space-y-0.5">
              {selected.owned_paths.map((p) => (
                <div key={p} className="font-mono text-xs text-parchment-700 bg-parchment-200 px-2 py-0.5 rounded">
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thinking */}
        {selected.thinking && (
          <div className="mb-4 p-2 bg-blood/5 border border-blood/20 rounded">
            <h3 className="font-typewriter text-xs text-blood mb-1 flex items-center gap-1">
              <span className="animate-pulse">💭</span> thinking
            </h3>
            <div className="font-mono text-xs text-parchment-700 italic">
              {selected.thinking}
            </div>
          </div>
        )}

        {/* Task */}
        {selected.current_task_id && (
          <div className="mb-4">
            <h3 className="font-typewriter text-xs text-parchment-500 mb-1">current task</h3>
            <div className="font-mono text-xs text-blood">{selected.current_task_id}</div>
          </div>
        )}
      </div>

      {/* Identity panel — overlays on top */}
      {showIdentity && (
        <AgentIdentityPanel
          agentId={selected.id}
          agentName={selected.name}
          agentRole={selected.role}
          onClose={() => setShowIdentity(false)}
        />
      )}
    </>
  )
}
