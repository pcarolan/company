import { useWebSocket } from './hooks/useWebSocket'
import { Canvas } from './components/Canvas'
import { ProjectSidebar } from './components/ProjectSidebar'
import { AgentSidebar } from './components/AgentSidebar'
import { EventFeed } from './components/EventFeed'

export function App() {
  useWebSocket()

  return (
    <>
      <ProjectSidebar />
      <Canvas />
      <AgentSidebar />
      <EventFeed />
    </>
  )
}
