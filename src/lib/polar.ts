// Shared polar-coordinate helpers for the hand-rolled SVG wind roses
// (WindRose.tsx, MultiModelWindRose.tsx). Convention throughout: 0° = N = up,
// degrees increase clockwise, matching compass bearings directly.

export interface Point {
  x: number
  y: number
}

export function toXY(centerX: number, centerY: number, angleDeg: number, radius: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  return { x: centerX + radius * Math.sin(rad), y: centerY - radius * Math.cos(rad) }
}

/** Filled pie-wedge from the center out to radius r, spanning [startDeg, startDeg+spanDeg]. */
export function wedgePath(centerX: number, centerY: number, startDeg: number, spanDeg: number, r: number): string {
  if (spanDeg >= 360) {
    // Full circle: two semicircle arcs, since a single SVG arc can't span 360°.
    const top = toXY(centerX, centerY, startDeg, r)
    const bottom = toXY(centerX, centerY, startDeg + 180, r)
    return `M ${top.x} ${top.y} A ${r} ${r} 0 1 1 ${bottom.x} ${bottom.y} A ${r} ${r} 0 1 1 ${top.x} ${top.y} Z`
  }
  const start = toXY(centerX, centerY, startDeg, r)
  const end = toXY(centerX, centerY, startDeg + spanDeg, r)
  const largeArc = spanDeg > 180 ? 1 : 0
  return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

/** Just the curved band at radius r, no lines back to center — for stacking several sites' windows as concentric rings rather than overlapping wedges. */
export function arcPath(centerX: number, centerY: number, startDeg: number, spanDeg: number, r: number): string {
  if (spanDeg >= 360) {
    const top = toXY(centerX, centerY, startDeg, r)
    const bottom = toXY(centerX, centerY, startDeg + 180, r)
    return `M ${top.x} ${top.y} A ${r} ${r} 0 1 1 ${bottom.x} ${bottom.y} A ${r} ${r} 0 1 1 ${top.x} ${top.y}`
  }
  const start = toXY(centerX, centerY, startDeg, r)
  const end = toXY(centerX, centerY, startDeg + spanDeg, r)
  const largeArc = spanDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}
