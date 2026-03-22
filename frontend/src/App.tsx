import { useWebSocket } from './hooks/useWebSocket'
import { Canvas } from './components/Canvas'
import { Sidebar } from './components/Sidebar'
import { EventFeed } from './components/EventFeed'

export function App() {
  useWebSocket()

  return (
    <>
      <Canvas />
      <Sidebar />
      <EventFeed />
    </>
  )
}
