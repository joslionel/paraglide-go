import type { Reason } from '../lib/scoring'
import { REASON_TEXT } from './StatusPill'

const SIZE = 100
const CENTER = SIZE / 2
const RING_R = 42
const NEEDLE_R = 34

function toXY(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CENTER + r * Math.sin(rad), y: CENTER - r * Math.cos(rad) }
}

/** Filled pie-wedge from the center out to the ring, spanning the workable direction arc. */
function wedgePath(startDeg: number, spanDeg: number, r: number) {
  if (spanDeg >= 360) {
    // Full circle: two semicircle arcs, since a single SVG arc can't span 360°.
    const top = toXY(startDeg, r)
    const bottom = toXY(startDeg + 180, r)
    return `M ${top.x} ${top.y} A ${r} ${r} 0 1 1 ${bottom.x} ${bottom.y} A ${r} ${r} 0 1 1 ${top.x} ${top.y} Z`
  }
  const start = toXY(startDeg, r)
  const end = toXY(startDeg + spanDeg, r)
  const largeArc = spanDeg > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

export function WindRose({
  dirMin,
  dirMax,
  currentDir,
  currentReason,
  size = 56,
}: {
  dirMin: number | null
  dirMax: number | null
  currentDir?: number | null
  currentReason?: Reason
  size?: number
}) {
  const hasWindow = dirMin !== null && dirMax !== null
  const span = hasWindow ? ((dirMax! - dirMin! + 360) % 360) || 360 : 0
  const needleColor = currentReason ? REASON_TEXT[currentReason] : 'text-slate-400'
  const tip = currentDir != null ? toXY(currentDir, NEEDLE_R) : null

  return (
    <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-label="Wind rose">
      <circle cx={CENTER} cy={CENTER} r={RING_R} fill="none" strokeWidth={1.5} className="stroke-slate-200 dark:stroke-slate-700" />

      {hasWindow && (
        <path
          d={wedgePath(dirMin!, span, RING_R)}
          className="fill-emerald-500/30 stroke-emerald-500/70"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}

      <text x={CENTER} y={9} textAnchor="middle" fontSize={9} className="fill-slate-400 dark:fill-slate-500 select-none">
        N
      </text>

      {tip && (
        <g className={needleColor}>
          <line x1={CENTER} y1={CENTER} x2={tip.x} y2={tip.y} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={tip.x} cy={tip.y} r={3.5} fill="currentColor" />
        </g>
      )}

      <circle cx={CENTER} cy={CENTER} r={2} className="fill-slate-400 dark:fill-slate-500" />
    </svg>
  )
}
