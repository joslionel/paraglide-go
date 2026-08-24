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

/**
 * An invisible arc, centered on midDeg, sized to roughly fit textWidthPx of
 * text at radius r — meant as a path for SVG <textPath> so a label can curve
 * along a ring instead of sitting as flat horizontal text (which overlaps
 * between tightly-spaced rings and reads correctly only at the very top of
 * the circle).
 *
 * In this file's screen coordinates (0°=N=up, clockwise, y grows downward),
 * sweeping from lower to higher angle runs right-to-left across the bottom
 * half of the circle (90°–270°) — text-on-path would render upside down
 * there, so the sweep direction is flipped for that half to keep glyphs
 * upright.
 */
export function labelArcPath(centerX: number, centerY: number, midDeg: number, r: number, textWidthPx: number, maxSpanDeg = 150): string {
  const spanDeg = Math.min(maxSpanDeg, Math.max(24, (textWidthPx / r) * (180 / Math.PI)))
  const half = spanDeg / 2
  const upsideDown = midDeg > 90 && midDeg < 270
  const startDeg = upsideDown ? midDeg + half : midDeg - half
  const endDeg = upsideDown ? midDeg - half : midDeg + half
  const start = toXY(centerX, centerY, startDeg, r)
  const end = toXY(centerX, centerY, endDeg, r)
  const sweep = upsideDown ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 ${sweep} ${end.x} ${end.y}`
}
