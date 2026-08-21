import { toXY, wedgePath } from '../lib/polar'
import { MODEL_TEXT_CLASS, type ModelReading } from '../lib/multiModel'

const SIZE = 220
const CENTER = SIZE / 2
const RING_R = 85
const MAX_SPEED_MPH = 25 // scale ceiling — full-length spoke = this speed or more

const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
const SCALE_RINGS = [0.25, 0.5, 0.75, 1]

/**
 * The detailed sibling of WindRose.tsx — same flyable-window wedge (fixed,
 * a site property), but one spoke per weather model for the currently
 * selected hour instead of a single needle. Spoke length is proportional
 * to predicted speed (full ring = MAX_SPEED_MPH+), angle is predicted
 * direction (0°=N=up, clockwise), color-coded per model.
 */
export function MultiModelWindRose({
  dirMin,
  dirMax,
  models,
  size = SIZE,
}: {
  dirMin: number | null
  dirMax: number | null
  models: ModelReading[]
  size?: number
}) {
  const hasWindow = dirMin !== null && dirMax !== null
  const span = hasWindow ? ((dirMax! - dirMin! + 360) % 360) || 360 : 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-label="Per-model wind rose">
      {SCALE_RINGS.map((f) => (
        <circle key={f} cx={CENTER} cy={CENTER} r={RING_R * f} fill="none" strokeWidth={1} className="stroke-slate-200 dark:stroke-slate-800" />
      ))}

      {hasWindow && (
        <path
          d={wedgePath(CENTER, CENTER, dirMin!, span, RING_R)}
          className="fill-emerald-500/20 stroke-emerald-500/60"
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}

      {COMPASS_16.map((label, i) => {
        const angle = i * 22.5
        const isMajor = i % 4 === 0
        const pt = toXY(CENTER, CENTER, angle, RING_R + (isMajor ? 15 : 11))
        return (
          <text
            key={label}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={isMajor ? 10 : 8}
            className={isMajor ? 'fill-slate-500 font-medium dark:fill-slate-400' : 'fill-slate-400 dark:fill-slate-600'}
          >
            {label}
          </text>
        )
      })}

      {models.map((m) => {
        if (m.windSpeedMph === null || m.windDirectionDeg === null) return null
        const r = RING_R * Math.min(m.windSpeedMph / MAX_SPEED_MPH, 1)
        const tip = toXY(CENTER, CENTER, m.windDirectionDeg, r)
        return (
          <g key={m.model} className={MODEL_TEXT_CLASS[m.model]}>
            <line x1={CENTER} y1={CENTER} x2={tip.x} y2={tip.y} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            <circle cx={tip.x} cy={tip.y} r={3.5} fill="currentColor" />
          </g>
        )
      })}

      <circle cx={CENTER} cy={CENTER} r={2.5} className="fill-slate-400 dark:fill-slate-500" />
    </svg>
  )
}
