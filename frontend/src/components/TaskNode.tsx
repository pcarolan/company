import { useAgentStore, TaskNode as TaskData } from '../stores/useAgentStore'
import { PRIORITY_COLORS } from '../theme/colors'

interface Props {
  task: TaskData
}

export function TaskNode({ task }: Props) {
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[2]
  const selectedTaskId = useAgentStore((s) => s.selectedTaskId)
  const selectTask = useAgentStore((s) => s.selectTask)
  const isSelected = selectedTaskId === task.id

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectTask(task.id) }}
      className={`
        absolute select-none cursor-pointer
        w-40 rounded border border-parchment-300 border-l-4 ${priorityColor}
        bg-parchment-50 p-2.5
        transition-all duration-150
        ${isSelected ? 'ring-2 ring-blood shadow-md' : 'shadow-sm hover:shadow-md'}
      `}
      style={{
        left: task.x,
        top: task.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="font-sans text-xs font-semibold text-parchment-800 truncate">
        {task.title}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs font-mono px-1 py-0.5 rounded ${
          task.status === 'done' ? 'bg-green-100 text-green-700' :
          task.status === 'claimed' ? 'bg-blood/10 text-blood' :
          'bg-parchment-200 text-parchment-600'
        }`}>
          {task.status}
        </span>
        <span className="text-xs font-mono text-parchment-400">
          P{task.priority}
        </span>
      </div>
    </div>
  )
}
