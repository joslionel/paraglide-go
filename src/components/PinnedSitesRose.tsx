import { toXY, arcPath, labelArcPath } from '../lib/polar'

const SIZE = 380
const CENTER = SIZE / 2
const INNER_RADIUS = 36
const RING_SPACING = 20
const RING_STROKE = 16
const PIN_COUNT = 6
const ORBIT_RADII = Array.from({ length: PIN_COUNT }, (_, i) => INNER_RADIUS + i * RING_SPACING)
const OUTERMOST_RADIUS = ORBIT_RADII[PIN_COUNT - 1]
const DISC_RADIUS = CENTER - 2
const COMPASS_TICK_INNER = OUTERMOST_RADIUS + RING_STROKE / 2 + 4
const COMPASS_TICK_OUTER = COMPASS_TICK_INNER + 6
const CARDINAL_LABEL_RADIUS = COMPASS_TICK_OUTER + 9
const MINOR_LABEL_RADIUS = COMPASS_TICK_OUTER + 7

// Both the outermost ring and the compass labels around it must stay inside
// CENTER, or the last pinned site's ring / the N-S-E-W labels render off the
// edge of the canvas — this assertion catches that at dev time if the
// constants above ever get tuned back out of bounds.
if (import.meta.env.DEV) {
  const outermostRing = OUTERMOST_RADIUS + RING_STROKE / 2
  const outermostLabel = CARDINAL_LABEL_RADIUS + 6 // rough half-height of the bold cardinal labels
  if (outermostRing >= CENTER) {
    console.warn(`PinnedSitesRose: outermost ring edge (${outermostRing}) reaches the canvas edge (${CENTER}) — it may clip.`)
  }
  if (outermostLabel >= CENTER) {
    console.warn(`PinnedSitesRose: compass label radius (${outermostLabel}) reaches the canvas edge (${CENTER}) — labels may clip.`)
  }
}

// A distinct hue per ring — deliberately clear of the reserved status colors
// (green/amber/red) and the multi-model rose's blue/green/orange/purple, so
// this rose doesn't visually collide with either of those established
// palettes elsewhere in the app.
// Written out literally (not built from a shared hex array) so Tailwind's
// source-text scanner picks up every class — same reason StatusPill.tsx's
// REASON_* maps and multiModel.ts's MODEL_* maps are spelled out per-key.
const SITE_STROKE_CLASS = [
  'stroke-[#0d9488]',
  'stroke-[#db2777]',
  'stroke-[#4f46e5]',
  'stroke-[#0891b2]',
  'stroke-[#c026d3]',
  'stroke-[#92400e]',
]

// The 16-point compass, drawn as background context behind the ring stack.
// Cardinals render bold and larger; the rest (including the secondary
// intercardinals like NNW/WNW the user asked for) render smaller and lighter
// so they read as reference points, not competing labels.
const COMPASS_POINTS = [
  { label: 'N', angle: 0 },
  { label: 'NNE', angle: 22.5 },
  { label: 'NE', angle: 45 },
  { label: 'ENE', angle: 67.5 },
  { label: 'E', angle: 90 },
  { label: 'ESE', angle: 112.5 },
  { label: 'SE', angle: 135 },
  { label: 'SSE', angle: 157.5 },
  { label: 'S', angle: 180 },
  { label: 'SSW', angle: 202.5 },
  { label: 'SW', angle: 225 },
  { label: 'WSW', angle: 247.5 },
  { label: 'W', angle: 270 },
  { label: 'WNW', angle: 292.5 },
  { label: 'NW', angle: 315 },
  { label: 'NNW', angle: 337.5 },
]
const CARDINALS = new Set(['N', 'E', 'S', 'W'])

export interface PinnedRoseSite {
  slug: string
  name: string
  dirMin: number | null
  dirMax: number | null
}

/**
 * One ring per pinned site (innermost = first pinned), each showing that
 * site's flyable-direction window as a colored arc band at its own radius
 * (not a wedge from center — wedges from 5 different sites would just
 * overlap into a solid mess). The site name curves along the band itself,
 * following an invisible per-ring text path centered on the window's
 * midpoint, so it reads clearly even when two rings' windows point the same
 * way. A 16-point compass sits behind the rings for orientation, and all 6
 * ring "orbits" are always drawn faintly so there's a visible slot waiting
 * for each of up to 6 pins, even before they're all filled.
 */
export function PinnedSitesRose({ sites, size = SIZE }: { sites: PinnedRoseSite[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-label="Pinned sites wind rose">
      <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} className="fill-slate-100 stroke-slate-200 dark:fill-slate-800/70 dark:stroke-slate-700" strokeWidth={1} />

      {ORBIT_RADII.map((r) => (
        <circle key={r} cx={CENTER} cy={CENTER} r={r} fill="none" strokeWidth={1} className="stroke-slate-300/70 dark:stroke-slate-600/70" />
      ))}

      {COMPASS_POINTS.map(({ label, angle }) => {
        const isCardinal = CARDINALS.has(label)
        const tickStart = toXY(CENTER, CENTER, angle, COMPASS_TICK_INNER)
        const tickEnd = toXY(CENTER, CENTER, angle, COMPASS_TICK_OUTER)
        const labelPt = toXY(CENTER, CENTER, angle, isCardinal ? CARDINAL_LABEL_RADIUS : MINOR_LABEL_RADIUS)
        return (
          <g key={label}>
            <line
              x1={tickStart.x}
              y1={tickStart.y}
              x2={tickEnd.x}
              y2={tickEnd.y}
              strokeWidth={isCardinal ? 1.5 : 1}
              className="stroke-slate-400 dark:stroke-slate-500"
            />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isCardinal ? 11 : 7}
              fontWeight={isCardinal ? 700 : 500}
              className={isCardinal ? 'fill-slate-600 dark:fill-slate-300 select-none' : 'fill-slate-400 dark:fill-slate-500 select-none'}
            >
              {label}
            </text>
          </g>
        )
      })}

      {sites.slice(0, PIN_COUNT).map((site, i) => {
        const r = ORBIT_RADII[i]
        const hasWindow = site.dirMin !== null && site.dirMax !== null
        const span = hasWindow ? ((site.dirMax! - site.dirMin! + 360) % 360) || 360 : 0
        const midAngle = hasWindow ? site.dirMin! + span / 2 : 0
        const label = site.name.length > 16 ? `${site.name.slice(0, 15)}…` : site.name
        const labelPathId = `pinned-rose-label-${site.slug}`

        return (
          <g key={site.slug}>
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
