import { useCallback } from 'react'
import { useCanvasStore } from '../stores/useCanvasStore'
import { useAgentStore } from '../stores/useAgentStore'
import { AgentNode } from './AgentNode'
import { TaskNode } from './TaskNode'
import { MessageLine } from './MessageLine'
import { ProjectRegion } from './ProjectRegion'

export function Canvas() {
  const { offsetX, offsetY, zoom, startDrag, drag, endDrag, zoomBy } = useCanvasStore()
  const agents = useAgentStore((s) => s.agents)
  const tasks = useAgentStore((s) => s.tasks)
  const projects = useAgentStore((s) => s.projects)
  const messages = useAgentStore((s) => s.messages)
  const selectedId = useAgentStore((s) => s.selectedId)
  const select = useAgentStore((s) => s.select)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) startDrag(e.clientX, e.clientY)
  }, [startDrag])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    drag(e.clientX, e.clientY)
  }, [drag])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    zoomBy(e.deltaY, e.clientX, e.clientY)
  }, [zoomBy])

  // filter messages to only recent ones (< 8s)
  const recentMessages = messages.filter((m) => Date.now() - m.timestamp < 8000)

  return (
    <div
      className="w-full h-full relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onWheel={handleWheel}
      onClick={() => select(null)}
    >
      {/* Grid dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />

      {/* Canvas content */}
      <div
        className="absolute"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Center crosshair */}
        <div className="absolute w-px h-8 bg-parchment-300" style={{ left: 0, top: -16 }} />
        <div className="absolute h-px w-8 bg-parchment-300" style={{ left: -16, top: 0 }} />

        {/* Project regions (rendered behind everything) */}
        {projects.map((project) => (
          <ProjectRegion key={project.id} project={project} />
        ))}

        {/* SVG layer for lines */}
        <svg className="absolute pointer-events-none" style={{ left: -2000, top: -2000, width: 4000, height: 4000 }}>
          {/* Connection lines between agents and their tasks */}
          {tasks.filter(t => t.assigned_agent_id).map((task) => {
            const agent = agents.find(a => a.id === task.assigned_agent_id)
            if (!agent) return null
            return (
              <line
                key={`task-${agent.id}-${task.id}`}
                x1={agent.x + 2000}
                y1={agent.y + 2000}
                x2={task.x + 2000}
                y2={task.y + 2000}
                stroke="rgba(192, 57, 43, 0.15)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )
          })}

          {/* Agent-to-agent message lines */}
          {recentMessages.map((msg) => (
            <MessageLine key={msg.id} message={msg} agents={agents} />
          ))}
        </svg>

        {/* Tasks */}
        {tasks.map((task) => (
          <TaskNode key={task.id} task={task} />
        ))}

        {/* Agents */}
        {agents.map((agent) => (
          <AgentNode
            key={agent.id}
            agent={agent}
            selected={agent.id === selectedId}
            onSelect={() => select(agent.id)}
          />
        ))}
      </div>

      {/* HUD — top left */}
      <div className="fixed top-4 left-4 z-50">
        <h1 className="font-typewriter text-xl text-parchment-800">
          company <span className="text-blood">●</span>
        </h1>
        <div className="font-mono text-xs text-parchment-400 mt-0.5">
          {projects.length} projects · {agents.length} agents · {tasks.length} tasks · {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  )
}
