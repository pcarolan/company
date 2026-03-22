import { create } from 'zustand'

interface CanvasState {
  // viewport
  offsetX: number
  offsetY: number
  zoom: number
  hasFitted: boolean

  // drag state
  isDragging: boolean
  dragStartX: number
  dragStartY: number

  // actions
  startDrag: (x: number, y: number) => void
  drag: (x: number, y: number) => void
  endDrag: () => void
  zoomBy: (delta: number, cx: number, cy: number) => void
  fitToContent: (items: { x: number; y: number }[], viewW: number, viewH: number) => void
  reset: () => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  hasFitted: false,
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

  fitToContent: (items, viewW, viewH) => {
    if (items.length === 0) return

    const PADDING = 120  // px padding around content
    const NODE_W = 180   // approximate node width
    const NODE_H = 100   // approximate node height

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const item of items) {
      if (item.x < minX) minX = item.x
      if (item.y < minY) minY = item.y
      if (item.x + NODE_W > maxX) maxX = item.x + NODE_W
      if (item.y + NODE_H > maxY) maxY = item.y + NODE_H
    }

    const contentW = maxX - minX + PADDING * 2
    const contentH = maxY - minY + PADDING * 2

    const scaleX = viewW / contentW
    const scaleY = viewH / contentH
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.15), 1.5)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    set({
      zoom,
      offsetX: viewW / 2 - centerX * zoom,
      offsetY: viewH / 2 - centerY * zoom,
      hasFitted: true,
    })
  },

  reset: () => set({ offsetX: 0, offsetY: 0, zoom: 1, hasFitted: false }),
}))
