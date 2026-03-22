import { useEffect, useRef } from 'react'
import { useAgentStore } from '../stores/useAgentStore'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const setCanvas = useAgentStore((s) => s.setCanvas)
  const moveAgent = useAgentStore((s) => s.moveAgent)
  const updateAgent = useAgentStore((s) => s.updateAgent)
  const addEvent = useAgentStore((s) => s.addEvent)
  const addMessage = useAgentStore((s) => s.addMessage)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)

        if (msg.type === 'init' || msg.type === 'canvas_update') {
          // full canvas state — used for init and live updates during execution
          setCanvas(msg.data.agents, msg.data.tasks, msg.data.events, msg.data.projects, msg.data.plans)
        } else if (msg.type === 'agent_moved') {
          moveAgent(msg.data.agent_id, msg.data.x, msg.data.y)
        } else if (msg.type === 'agent_thinking') {
          updateAgent(msg.data.agent_id, { thinking: msg.data.thinking })
        } else if (msg.type === 'agent_message') {
          addMessage({
            id: msg.data.id,
            from_id: msg.data.from_id,
            to_id: msg.data.to_id,
            from_name: msg.data.from_name,
            to_name: msg.data.to_name,
            text: msg.data.text,
            timestamp: Date.now(),
          })
          addEvent(msg.data.event)
        } else if (msg.type === 'event') {
          addEvent(msg.data)
        }
      }

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null
          // auto-reconnect
          reconnectTimer = setTimeout(connect, 2000)
        }
      }
    }

    connect()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (wsRef.current) wsRef.current.close()
    }
  }, [setCanvas, moveAgent, updateAgent, addEvent, addMessage])

  return wsRef
}
