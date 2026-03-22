import { create } from 'zustand'

interface CanvasState {
  // viewport
  offsetX: number
  offsetY: number
  zoom: number

  // drag state
  isDragging: boolean
  dragStartX: number
  dragStartY: number

  // actions
  startDrag: (x: number, y: number) => void
  drag: (x: number, y: number) => void
  endDrag: () => void
  zoomBy: (delta: number, cx: number, cy: number) => void
  reset: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,

  startDrag: (x, y) => set({
    isDragging: true,
    dragStartX: x - get().offsetX,
    dragStartY: y - get().offsetY,
  }),

  drag: (x, y) => {
    if (!get().isDragging) return
    set({
      offsetX: x - get().dragStartX,
      offsetY: y - get().dragStartY,
    })
  },

  endDrag: () => set({ isDragging: false }),

  zoomBy: (delta, cx, cy) => {
    const { zoom, offsetX, offsetY } = get()
    const factor = delta > 0 ? 0.9 : 1.1
    const newZoom = Math.min(Math.max(zoom * factor, 0.1), 5)

    // zoom toward cursor
    const scale = newZoom / zoom
    set({
      zoom: newZoom,
      offsetX: cx - (cx - offsetX) * scale,
      offsetY: cy - (cy - offsetY) * scale,
    })
  },

  reset: () => set({ offsetX: 0, offsetY: 0, zoom: 1 }),
}))
