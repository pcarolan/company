import { useAgentStore, EventItem } from '../stores/useAgentStore'

const EVENT_ICONS: Record<string, string> = {
  commit: '↑',
  revert: '↩',
  gate_pass: '✅',
  gate_fail: '❌',
  task_claimed: '🔒',
  task_completed: '✓',
  review_finding: '👁',
  review_clean: '✨',
  agent_stuck: '⚠',
  branch_created: '⎇',
  branch_merged: '🔀',
  message: '💬',
}

function EventRow({ event }: { event: EventItem }) {
  const icon = EVENT_ICONS[event.type] || '●'
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="flex items-start gap-2 py-1 px-2 text-xs border-b border-parchment-200 last:border-0">
      <span className="shrink-0 w-4 text-center">{icon}</span>
      <span className="font-mono text-parchment-400 shrink-0">{time}</span>
      <span className="text-parchment-700 truncate">{event.message}</span>
    </div>
  )
}

export function EventFeed() {
  const events = useAgentStore((s) => s.events)
  const reversed = [...events].reverse()

  return (
    <div className="
      fixed bottom-0 right-0 w-80
      bg-parchment-50/95 backdrop-blur-sm
      border-l border-t border-parchment-300
      max-h-64 overflow-y-auto
      z-50
    ">
      <div className="sticky top-0 bg-parchment-100 border-b border-parchment-300 px-3 py-1.5">
        <span className="font-typewriter text-xs text-parchment-600">event feed</span>
      </div>
      {reversed.length === 0 ? (
        <div className="p-3 text-xs text-parchment-400 font-mono">waiting for events...</div>
      ) : (
        reversed.map((e) => <EventRow key={e.id} event={e} />)
      )}
    </div>
  )
}
