/** Radiohead-inspired status colors for agent nodes. */

export const STATUS_COLORS: Record<string, { bg: string; border: string; pulse: boolean }> = {
  idle: { bg: 'bg-parchment-200', border: 'border-parchment-400', pulse: false },
  working: { bg: 'bg-blood/10', border: 'border-blood', pulse: true },
  stuck: { bg: 'bg-red-100', border: 'border-red-500', pulse: true },
  reviewing: { bg: 'bg-amber-50', border: 'border-amber-500', pulse: false },
  pushing: { bg: 'bg-green-50', border: 'border-green-600', pulse: true },
  offline: { bg: 'bg-parchment-100', border: 'border-parchment-300', pulse: false },
}

export const ROLE_ICONS: Record<string, string> = {
  implementer: '⚡',
  tester: '🧪',
  architect: '📐',
  reviewer: '👁',
  integrator: '🔀',
  scout: '🔭',
  planner: '📝',
}

export const PRIORITY_COLORS: Record<number, string> = {
  0: 'border-l-red-600',    // critical
  1: 'border-l-blood',      // high
  2: 'border-l-amber-500',  // medium
  3: 'border-l-parchment-500', // low
  4: 'border-l-parchment-300', // backlog
}
