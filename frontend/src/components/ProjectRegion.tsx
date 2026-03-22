import { ProjectNode } from '../stores/useAgentStore'

interface Props {
  project: ProjectNode
}

const STATUS_BORDER: Record<string, string> = {
  planning: 'border-parchment-400',
  active: 'border-blood/40',
  paused: 'border-amber-400/40',
  completed: 'border-green-500/40',
  archived: 'border-parchment-300',
}

const STATUS_BG: Record<string, string> = {
  planning: 'bg-parchment-200/20',
  active: 'bg-blood/[0.03]',
  paused: 'bg-amber-50/30',
  completed: 'bg-green-50/20',
  archived: 'bg-parchment-100/20',
}

export function ProjectRegion({ project }: Props) {
  const borderColor = STATUS_BORDER[project.status] || STATUS_BORDER.planning
  const bgColor = STATUS_BG[project.status] || STATUS_BG.planning

  return (
    <div
      className={`
        absolute rounded-xl border-2 border-dashed
        ${borderColor} ${bgColor}
        pointer-events-none
      `}
      style={{
        left: project.x,
        top: project.y,
        width: project.width,
        height: project.height,
      }}
    >
      {/* Project header — top left corner */}
      <div className="absolute -top-3 left-4 px-2 bg-parchment-100">
        <span className="font-typewriter text-sm text-parchment-600">
          {project.name}
        </span>
        <span className={`ml-2 text-xs font-mono px-1.5 py-0.5 rounded ${
          project.status === 'active' ? 'bg-blood/10 text-blood' :
          project.status === 'completed' ? 'bg-green-100 text-green-700' :
          'bg-parchment-200 text-parchment-500'
        }`}>
          {project.status}
        </span>
      </div>

      {/* Gate badges — bottom left */}
      {Object.keys(project.gates).length > 0 && (
        <div className="absolute bottom-2 left-3 flex gap-1.5">
          {Object.keys(project.gates).map((gate) => (
            <span
              key={gate}
              className="text-xs font-mono px-1.5 py-0.5 rounded bg-parchment-200/60 text-parchment-500 border border-parchment-300/50"
            >
              {gate}
            </span>
          ))}
        </div>
      )}

      {/* Cost + counts — bottom right */}
      <div className="absolute bottom-2 right-3 text-xs font-mono text-parchment-400">
        {project.cost_usd > 0 && (
          <span className="text-amber-600 mr-2">
            ${project.cost_usd < 0.01 ? project.cost_usd.toFixed(4) : project.cost_usd.toFixed(2)}
          </span>
        )}
        {project.agent_ids.length} agents · {project.task_ids.length} tasks
      </div>
    </div>
  )
}
