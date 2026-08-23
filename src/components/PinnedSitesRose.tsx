import type { Reason } from '../lib/scoring'
import { REASON_TEXT } from './StatusPill'
import { toXY, arcPath } from '../lib/polar'

const SIZE = 340
const CENTER = SIZE / 2
const INNER_RADIUS = 42
const RING_SPACING = 24
const RING_STROKE = 7
const LABEL_OFFSET = RING_STROKE / 2 + 8 // clear of the ring's own stroke width, not drawn on top of it

// Outermost ring + its label must stay inside CENTER, or a 5th pinned site's
// name renders off the edge of the canvas — this assertion catches that at
// dev time if the constants above ever get tuned back out of bounds.
if (import.meta.env.DEV) {
  const outermost = INNER_RADIUS + 4 * RING_SPACING + LABEL_OFFSET
  if (outermost >= CENTER) {
    console.warn(`PinnedSitesRose: outermost label radius (${outermost}) reaches the canvas edge (${CENTER}) — labels may clip.`)
  }
}

// A distinct hue per ring — deliberately clear of the reserved status colors
// (green/amber/red) and the multi-model rose's blue/green/orange/purple, so
// this rose doesn't visually collide with either of those established
// palettes elsewhere in the app.
// Written out literally (not built from a shared hex array) so Tailwind's
// source-text scanner picks up every class — same reason StatusPill.tsx's
// REASON_* maps and multiModel.ts's MODEL_* maps are spelled out per-key.
const SITE_TEXT_CLASS = ['text-[#0d9488]', 'text-[#db2777]', 'text-[#4f46e5]', 'text-[#0891b2]', 'text-[#c026d3]']
const SITE_STROKE_CLASS = ['stroke-[#0d9488]', 'stroke-[#db2777]', 'stroke-[#4f46e5]', 'stroke-[#0891b2]', 'stroke-[#c026d3]']

export interface PinnedRoseSite {
  slug: string
  name: string
  dirMin: number | null
  dirMax: number | null
  currentDir?: number | null
  currentReason?: Reason
}

/**
 * One ring per pinned site (innermost = first pinned), each showing that
 * site's flyable-direction window as a colored arc band at its own radius
 * (not a wedge from center — wedges from 5 different sites would just
 * overlap into a solid mess) plus a dot for that site's current wind
 * direction, colored the usual on/marginal/off way. A short label sits just
 * outside each ring at the arc's midpoint.
 */
export function PinnedSitesRose({ sites, size = SIZE }: { sites: PinnedRoseSite[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-label="Pinned sites wind rose">
      <text x={CENTER} y={16} textAnchor="middle" fontSize={10} className="fill-slate-400 dark:fill-slate-500 select-none">
        N
      </text>
      <circle cx={CENTER} cy={CENTER} r={2.5} className="fill-slate-400 dark:fill-slate-500" />

      {sites.slice(0, 5).map((site, i) => {
        const r = INNER_RADIUS + i * RING_SPACING
        const hasWindow = site.dirMin !== null && site.dirMax !== null
        const span = hasWindow ? ((site.dirMax! - site.dirMin! + 360) % 360) || 360 : 0
        const midAngle = hasWindow ? site.dirMin! + span / 2 : 0
        const labelPt = toXY(CENTER, CENTER, midAngle, r + LABEL_OFFSET)
        const needleColor = site.currentReason ? REASON_TEXT[site.currentReason] : 'text-slate-400'
        const needleTip = site.currentDir != null ? toXY(CENTER, CENTER, site.currentDir, r) : null

        return (
          <g key={site.slug}>
            <circle cx={CENTER} cy={CENTER} r={r} fill="none" strokeWidth={1} className="stroke-slate-100 dark:stroke-slate-800" />

            {hasWindow && (
              <path
                d={arcPath(CENTER, CENTER, site.dirMin!, span, r)}
                fill="none"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                className={SITE_STROKE_CLASS[i % SITE_STROKE_CLASS.length]}
                opacity={0.55}
              />
            )}

            {needleTip && (
              <circle cx={needleTip.x} cy={needleTip.y} r={4} className={needleColor} fill="currentColor" stroke="white" strokeWidth={1} />
            )}

            {hasWindow && (
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fontWeight={600}
                className={`${SITE_TEXT_CLASS[i % SITE_TEXT_CLASS.length]} select-none`}
              >
                {site.name.length > 14 ? `${site.name.slice(0, 13)}…` : site.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
