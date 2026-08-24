import type { Reason } from '../lib/scoring'
import { REASON_TEXT } from './StatusPill'
import { toXY, arcPath, labelArcPath } from '../lib/polar'

const SIZE = 300
const CENTER = SIZE / 2
const INNER_RADIUS = 36
const RING_SPACING = 20
const RING_STROKE = 16

// Outermost ring must stay inside CENTER (with room for its label, which now
// sits on top of the band rather than outside it) or a 5th pinned site's ring
// renders off the edge of the canvas — this assertion catches that at dev
// time if the constants above ever get tuned back out of bounds.
if (import.meta.env.DEV) {
  const outermost = INNER_RADIUS + 4 * RING_SPACING + RING_STROKE / 2
  if (outermost >= CENTER) {
    console.warn(`PinnedSitesRose: outermost ring edge (${outermost}) reaches the canvas edge (${CENTER}) — it may clip.`)
  }
}

// A distinct hue per ring — deliberately clear of the reserved status colors
// (green/amber/red) and the multi-model rose's blue/green/orange/purple, so
// this rose doesn't visually collide with either of those established
// palettes elsewhere in the app.
// Written out literally (not built from a shared hex array) so Tailwind's
// source-text scanner picks up every class — same reason StatusPill.tsx's
// REASON_* maps and multiModel.ts's MODEL_* maps are spelled out per-key.
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
 * direction, colored the usual on/marginal/off way. The site name curves
 * along the band itself, following an invisible per-ring text path centered
 * on the window's midpoint, so it reads clearly even when two rings' windows
 * point the same way (labels used to be flat text and would overlap when
 * tightly spaced).
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
        const needleColor = site.currentReason ? REASON_TEXT[site.currentReason] : 'text-slate-400'
        const needleTip = site.currentDir != null ? toXY(CENTER, CENTER, site.currentDir, r) : null
        const label = site.name.length > 16 ? `${site.name.slice(0, 15)}…` : site.name
        const labelPathId = `pinned-rose-label-${site.slug}`

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
                opacity={0.85}
              />
            )}

            {needleTip && (
              <circle cx={needleTip.x} cy={needleTip.y} r={5} className={needleColor} fill="currentColor" stroke="white" strokeWidth={1.5} />
            )}

            {hasWindow && (
              <>
                <path id={labelPathId} d={labelArcPath(CENTER, CENTER, midAngle, r, label.length * 5.2)} fill="none" />
                <text
                  fontSize={9}
                  fontWeight={700}
                  className="fill-white select-none"
                  style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 2 }}
                >
                  <textPath href={`#${labelPathId}`} startOffset="50%" textAnchor="middle">
                    {label}
                  </textPath>
                </text>
              </>
            )}
          </g>
        )
      })}
    </svg>
  )
}
