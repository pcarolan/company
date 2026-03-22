import { useEffect, useState } from 'react'
import { AgentMessage, AgentNode } from '../stores/useAgentStore'

interface Props {
  message: AgentMessage
  agents: AgentNode[]
}

const MESSAGE_TTL = 8000 // 8 seconds

export function MessageLine({ message, agents }: Props) {
  const [opacity, setOpacity] = useState(1)
  const from = agents.find((a) => a.id === message.from_id)
  const to = agents.find((a) => a.id === message.to_id)

  useEffect(() => {
    const age = Date.now() - message.timestamp
    const remaining = MESSAGE_TTL - age
    if (remaining <= 0) {
      setOpacity(0)
      return
    }

    // fade out over last 2 seconds
    const fadeStart = Math.max(0, remaining - 2000)
    const timer = setTimeout(() => {
      setOpacity(0)
    }, fadeStart)

    return () => clearTimeout(timer)
  }, [message.timestamp])

  if (!from || !to || opacity === 0) return null

  // midpoint for the label
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2

  return (
    <g style={{ opacity, transition: 'opacity 2s ease-out' }}>
      {/* Animated line */}
      <line
        x1={from.x + 2000}
        y1={from.y + 2000}
        x2={to.x + 2000}
        y2={to.y + 2000}
        stroke="rgba(192, 57, 43, 0.6)"
        strokeWidth={2}
        strokeDasharray="6 4"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-20"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </line>

      {/* Direction arrow at midpoint */}
      <circle
        cx={midX + 2000}
        cy={midY + 2000}
        r={3}
        fill="rgba(192, 57, 43, 0.8)"
      >
        <animate
          attributeName="r"
          values="2;4;2"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Message bubble */}
      <foreignObject
        x={midX + 2000 - 80}
        y={midY + 2000 - 32}
        width={160}
        height={40}
      >
        <div
          className="bg-parchment-50 border border-blood/30 rounded px-2 py-1 text-center shadow-sm"
          style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
        >
          <span className="text-blood font-bold">{message.from_name}</span>
          <span className="text-parchment-500"> → </span>
          <span className="text-blood font-bold">{message.to_name}</span>
          <div className="text-parchment-700 truncate leading-tight">
            {message.text}
          </div>
        </div>
      </foreignObject>
    </g>
  )
}
