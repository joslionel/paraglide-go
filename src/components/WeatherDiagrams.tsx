// Schematic illustrations for the weather course — simple shapes rather than
// literal meteorological art, chosen so they render crisply at small sizes
// and stay legible in both light and dark mode (all colors set explicitly,
// no reliance on currentColor / theme CSS).
const INK = '#475569' // slate-600, used for ground lines / labels' leader lines
const CLOUD = '#94a3b8' // slate-400
const RAIN = '#3b82f6' // blue-500

function Cloud({ x, y, scale = 1, dark = false }: { x: number; y: number; scale?: number; dark?: boolean }) {
  const fill = dark ? '#64748b' : CLOUD
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="-14" cy="0" r="12" fill={fill} />
      <circle cx="0" cy="-6" r="15" fill={fill} />
      <circle cx="15" cy="0" r="12" fill={fill} />
      <rect x="-24" y="0" width="48" height="10" rx="5" fill={fill} />
    </g>
  )
}

function Rain({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={RAIN} strokeWidth="2" strokeLinecap="round">
      <line x1={x - 8} y1={y} x2={x - 11} y2={y + 10} />
      <line x1={x} y1={y} x2={x - 3} y2={y + 10} />
      <line x1={x + 8} y1={y} x2={x + 5} y2={y + 10} />
    </g>
  )
}

/** Side-on cross-section: warm air riding up a shallow slope over retreating cold air, with the classic thickening-cloud sequence ahead of the surface front. Labels are kept short and placed with generous margin on all sides — this renders at card width, so there's no room for long strings to safely auto-wrap. */
export function WarmFrontCrossSection() {
  return (
    <svg viewBox="0 0 340 150" className="h-auto w-full">
      <line x1="10" y1="125" x2="330" y2="125" stroke={INK} strokeWidth="2" />
      <path d="M 60 125 L 300 30" stroke="#d03b3b" strokeWidth="2.5" fill="none" />
      <text x="230" y="112" fontSize="12" fill={INK}>
        Cold air
      </text>
      <text x="120" y="52" fontSize="12" fill={INK}>
        Warm air
      </text>
      <Cloud x={90} y={100} scale={0.55} />
      <Cloud x={140} y={85} scale={0.8} />
      <Cloud x={190} y={70} scale={1.1} />
      <Rain x={190} y={92} />
      <Cloud x={240} y={58} scale={0.5} />
      <text x="20" y="143" fontSize="10" fill={INK}>
        ⟶ front moves this way
      </text>
    </svg>
  )
}

/** Side-on cross-section: a steep cold front undercutting and abruptly lifting the warm air ahead of it — hence the narrower, more violent band of weather. */
export function ColdFrontCrossSection() {
  return (
    <svg viewBox="0 0 340 150" className="h-auto w-full">
      <line x1="10" y1="125" x2="330" y2="125" stroke={INK} strokeWidth="2" />
      <path d="M 210 125 L 165 30 L 145 30" stroke="#2563eb" strokeWidth="2.5" fill="none" />
      <text x="40" y="112" fontSize="12" fill={INK}>
        Cold air
      </text>
      <text x="230" y="52" fontSize="12" fill={INK}>
        Warm air
      </text>
      <Cloud x={180} y={65} scale={1.3} dark />
      <Cloud x={192} y={42} scale={0.9} dark />
      <Rain x={180} y={100} />
      <Rain x={200} y={100} />
      <text x="20" y="143" fontSize="10" fill={INK}>
        ⟶ front moves this way
      </text>
    </svg>
  )
}

/**
 * A standard synoptic wind barb: a circle at the calm end, a shaft, and
 * feathers at the far end encoding speed — each pennant (filled triangle) is
 * 50 knots, each full barb (long line) 10 knots, each half barb (short line)
 * 5 knots, summed and rounded to the nearest 5.
 */
export function WindBarb({ knots, label }: { knots: number; label?: string }) {
  const rounded = Math.max(0, Math.round(knots / 5) * 5)
  let remaining = rounded
  const pennants = Math.floor(remaining / 50)
  remaining -= pennants * 50
  const fullBarbs = Math.floor(remaining / 10)
  remaining -= fullBarbs * 10
  const halfBarbs = Math.floor(remaining / 5)

  const shaftStart = 30
  const shaftEnd = 150
  const step = 13
  const feathers: React.ReactNode[] = []
  let pos = shaftEnd
  for (let i = 0; i < pennants; i++) {
    feathers.push(<path key={`p${i}`} d={`M ${pos} 50 L ${pos - step} 50 L ${pos - step / 2} 32 Z`} fill={INK} />)
    pos -= step
  }
  for (let i = 0; i < fullBarbs; i++) {
    feathers.push(<line key={`f${i}`} x1={pos} y1="50" x2={pos - 9} y2="28" stroke={INK} strokeWidth="2.5" />)
    pos -= step * 0.65
  }
  for (let i = 0; i < halfBarbs; i++) {
    feathers.push(<line key={`h${i}`} x1={pos} y1="50" x2={pos - 5} y2="38" stroke={INK} strokeWidth="2.5" />)
    pos -= step * 0.65
  }

  return (
    <svg viewBox="0 0 170 75" className="h-auto w-full">
      <circle cx={shaftStart} cy="50" r="5" fill="none" stroke={INK} strokeWidth="2" />
      {rounded > 0 && <line x1={shaftStart + 5} y1="50" x2={shaftEnd} y2="50" stroke={INK} strokeWidth="2" />}
      {feathers}
      {label && (
        <text x="90" y="70" fontSize="11" fill={INK} textAnchor="middle">
          {label}
        </text>
      )}
    </svg>
  )
}

/** Two mini isobar panels side by side, contrasting wide spacing (light wind) with tight spacing (strong wind) for the same pressure difference. */
export function IsobarSpacingDiagram() {
  return (
    <svg viewBox="-10 0 310 120" className="h-auto w-full">
      <g>
        {[20, 48, 76, 104].map((x) => (
          <line key={x} x1={x} y1="10" x2={x} y2="90" stroke={INK} strokeWidth="1.5" opacity={0.7} />
        ))}
        <text x="62" y="108" fontSize="10.5" fill={INK} textAnchor="middle">
          Widely spaced → light wind
        </text>
      </g>
      <g transform="translate(160 0)">
        {[10, 24, 38, 52, 66, 80, 94, 108].map((x) => (
          <line key={x} x1={x} y1="10" x2={x} y2="90" stroke={INK} strokeWidth="1.5" opacity={0.7} />
        ))}
        <text x="59" y="108" fontSize="10.5" fill={INK} textAnchor="middle">
          Tightly packed → strong wind
        </text>
      </g>
    </svg>
  )
}

/** Isobars kinking sharply around a trough axis (dashed line) — the trough itself has no closed circulation, unlike a full low. */
export function TroughDiagram() {
  const isobarY = [22, 44, 66, 88]
  return (
    <svg viewBox="0 0 280 130" className="h-auto w-full">
      {isobarY.map((y) => (
        <path key={y} d={`M 10 ${y} Q 150 ${y} 160 ${y + 22} Q 170 ${y} 270 ${y}`} fill="none" stroke={INK} strokeWidth="1.5" opacity={0.7} />
      ))}
      <line x1="160" y1="8" x2="180" y2="118" stroke="#0f172a" strokeWidth="2.5" />
      <text x="186" y="24" fontSize="11" fill="#0f172a">
        Trough axis
      </text>
      <text x="60" y="122" fontSize="10.5" fill={INK}>
        lower pressure along the kink
      </text>
    </svg>
  )
}

/**
 * Height-vs-temperature sketch comparing how the actual atmosphere cools
 * with height on a given day (ELR) against how a rising parcel of air cools
 * (DALR below cloud base, the shallower SALR above it) — schematic, not to
 * scale, but the parcel line is deliberately kept to the right of (warmer
 * than) the ELR line throughout, since that's the definition of instability.
 */
/**
 * Height-vs-temperature sketch comparing the day's actual ELR against a
 * rising parcel's DALR (and SALR above cloud base) — the same idea a real
 * tephigram plots from a morning sounding. Parameterized so the worked
 * examples below can reuse it with different endpoints; `minimal` drops the
 * text labels for those small side-by-side variants (the coloring/position
 * alone carries the story once the labelled version above has taught it).
 */
export function ThermalDiagram({
  elrEnd = [110, 40],
  cloudBase = [180, 110],
  parcelTop = [165, 40],
  minimal = false,
}: {
  elrEnd?: [number, number]
  cloudBase?: [number, number] | null
  parcelTop?: [number, number]
  minimal?: boolean
}) {
  const ground: [number, number] = [230, 185]
  const dalrEnd = cloudBase ?? parcelTop
  return (
    <svg viewBox="0 0 300 210" className="h-auto w-full">
      <line x1="55" y1="15" x2="55" y2="188" stroke={INK} strokeWidth="1.5" />
      <line x1="55" y1="188" x2="278" y2="188" stroke={INK} strokeWidth="1.5" />
      {!minimal && (
        <>
          <text x="18" y="28" fontSize="10" fill={INK}>
            Height
          </text>
          <text x="150" y="203" fontSize="10" fill={INK}>
            Warmer →
          </text>
        </>
      )}

      <path d={`M ${ground[0]} ${ground[1]} L ${elrEnd[0]} ${elrEnd[1]}`} stroke={INK} strokeWidth="2" fill="none" />
      {!minimal && (
        <text x={Math.max(8, elrEnd[0] - 45)} y={Math.max(15, elrEnd[1] - 2)} fontSize="10.5" fill={INK}>
          ELR (today)
        </text>
      )}

      <path d={`M ${ground[0]} ${ground[1]} L ${dalrEnd[0]} ${dalrEnd[1]}`} stroke="#d03b3b" strokeWidth="2.5" fill="none" />
      {!minimal && (
        <text x={ground[0] - 35} y="155" fontSize="10.5" fill="#d03b3b">
          DALR
        </text>
      )}

      {cloudBase && (
        <>
          <path d={`M ${cloudBase[0]} ${cloudBase[1]} L ${parcelTop[0]} ${parcelTop[1]}`} stroke="#2563eb" strokeWidth="2.5" fill="none" />
          <circle cx={cloudBase[0]} cy={cloudBase[1]} r="3.5" fill="#2563eb" />
          {!minimal && (
            <>
              <text x={cloudBase[0] + 4} y={cloudBase[1] - 3} fontSize="9.5" fill={INK}>
                Cloud base
              </text>
              <text x={Math.max(8, parcelTop[0] - 15)} y={Math.max(15, parcelTop[1] - 3)} fontSize="10.5" fill="#2563eb">
                SALR
              </text>
            </>
          )}
        </>
      )}

      <circle cx={ground[0]} cy={ground[1]} r="3.5" fill={INK} />
      {!minimal && (
        <text x={ground[0] - 25} y={ground[1] + 15} fontSize="9.5" fill={INK}>
          Ground
        </text>
      )}
    </svg>
  )
}

/** Two mini cross-sections side by side: sun-warmed slopes drive an upslope (anabatic) wind by day; slopes radiating heat away drive a downslope (katabatic) wind at night. */
export function ValleyWindDiagram() {
  return (
    <svg viewBox="0 0 300 145" className="h-auto w-full">
      <g>
        <path d="M 10 120 L 70 30 L 130 120 Z" fill="none" stroke={INK} strokeWidth="2" />
        <line x1="40" y1="100" x2="58" y2="58" stroke="#d03b3b" strokeWidth="2.5" markerEnd="url(#vw-up)" />
        <text x="70" y="140" fontSize="10.5" fill={INK} textAnchor="middle">
          Day — anabatic
        </text>
      </g>
      <g transform="translate(160 0)">
        <path d="M 10 120 L 70 30 L 130 120 Z" fill="none" stroke={INK} strokeWidth="2" />
        <line x1="58" y1="58" x2="40" y2="100" stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#vw-down)" />
        <text x="70" y="140" fontSize="10.5" fill={INK} textAnchor="middle">
          Night — katabatic
        </text>
      </g>
      <defs>
        <marker id="vw-up" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,8 L4,0 L8,8 Z" fill="#d03b3b" />
        </marker>
        <marker id="vw-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,0 L4,8 Z" fill="#2563eb" />
        </marker>
      </defs>
    </svg>
  )
}

/** Cross-section: land heating faster than the sea drives a surface flow from sea to land, with the leading (cooler) edge of that flow forming the sea-breeze front. */
export function SeaBreezeDiagram() {
  return (
    <svg viewBox="0 0 320 145" className="h-auto w-full">
      <rect x="0" y="88" width="130" height="12" fill="#93c5fd" opacity={0.6} />
      <line x1="130" y1="88" x2="310" y2="88" stroke={INK} strokeWidth="2" />
      <text x="30" y="112" fontSize="11" fill={INK}>
        Sea (cool)
      </text>
      <text x="230" y="112" fontSize="11" fill={INK}>
        Land (warm)
      </text>
      <line x1="55" y1="80" x2="195" y2="80" stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#sb-arrow)" />
      <text x="70" y="70" fontSize="10.5" fill="#2563eb">
        sea breeze
      </text>
      <line x1="245" y1="80" x2="245" y2="35" stroke="#d03b3b" strokeWidth="2.5" markerEnd="url(#sb-up)" />
      <Cloud x={195} y={45} scale={0.6} />
      <text x="150" y="20" fontSize="10.5" fill={INK}>
        Sea-breeze front
      </text>
      <defs>
        <marker id="sb-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
        </marker>
        <marker id="sb-up" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,8 L4,0 L8,8 Z" fill="#d03b3b" />
        </marker>
      </defs>
    </svg>
  )
}

/** A ridge deflecting steady wind into standing waves downwind — smooth lift near the crests (marked by motionless lenticular cloud), dangerous rotor turbulence in the lee near the ground. */
export function WaveLiftDiagram() {
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full">
      <line x1="4" y1="120" x2="316" y2="120" stroke={INK} strokeWidth="2" />
      <path d="M 40 120 L 90 40 L 140 120 Z" fill="none" stroke={INK} strokeWidth="2" />
      <line x1="10" y1="90" x2="33" y2="90" stroke={INK} strokeWidth="2" markerEnd="url(#wv-wind)" />
      <text x="4" y="80" fontSize="10" fill={INK}>
        Wind
      </text>
      <path d="M 140 100 Q 175 60 210 100 Q 245 130 280 100" stroke={INK} strokeWidth="1.5" fill="none" opacity={0.6} />
      <path d="M 140 113 Q 175 85 210 113 Q 245 138 280 113" stroke={INK} strokeWidth="1.5" fill="none" opacity={0.6} />
      <ellipse cx="177" cy="53" rx="22" ry="7" fill="#cbd5e1" />
      <ellipse cx="247" cy="70" rx="17" ry="6" fill="#cbd5e1" />
      <text x="150" y="30" fontSize="10" fill={INK}>
        Lenticular cloud
      </text>
      <circle cx="150" cy="106" r="9" fill="none" stroke="#d03b3b" strokeWidth="2" strokeDasharray="4 3" />
      <text x="130" y="140" fontSize="10" fill="#d03b3b">
        Rotor
      </text>
    </svg>
  )
}

/** Two small compass arcs illustrating veer (clockwise wind shift) and back (anticlockwise). */
export function VeerBackDiagram() {
  return (
    <svg viewBox="0 0 300 130" className="h-auto w-full">
      <g>
        <path d="M 60 100 A 40 40 0 0 1 100 30" fill="none" stroke="#0ca30c" strokeWidth="3" markerEnd="url(#veer-arrow)" />
        <text x="38" y="118" fontSize="11" fill={INK}>
          S
        </text>
        <text x="105" y="22" fontSize="11" fill={INK}>
          W
        </text>
        <text x="15" y="45" fontSize="12" fill="#0ca30c" fontWeight="700">
          Veer
        </text>
      </g>
      <g transform="translate(160 0)">
        <path d="M 100 100 A 40 40 0 0 0 60 30" fill="none" stroke="#d03b3b" strokeWidth="3" markerEnd="url(#back-arrow)" />
        <text x="102" y="118" fontSize="11" fill={INK}>
          W
        </text>
        <text x="38" y="22" fontSize="11" fill={INK}>
          S
        </text>
        <text x="105" y="45" fontSize="12" fill="#d03b3b" fontWeight="700">
          Back
        </text>
      </g>
      <defs>
        <marker id="veer-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#0ca30c" />
        </marker>
        <marker id="back-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#d03b3b" />
        </marker>
      </defs>
    </svg>
  )
}

/** Plan view: concentric isobars with a rotation arrow — anticlockwise for a Northern-Hemisphere low, clockwise for a high. */
export function PressureSystemDiagram({ kind }: { kind: 'low' | 'high' }) {
  const color = kind === 'low' ? '#d03b3b' : '#0ca30c'
  const anticlockwise = kind === 'low'
  // A ~300° arc so the rotation direction is unambiguous; arrowhead marks the direction of flow.
  const arcPath = anticlockwise ? 'M 90 20 A 55 55 0 1 0 91 20' : 'M 91 20 A 55 55 0 1 1 90 20'
  return (
    <svg viewBox="0 0 180 180" className="h-auto w-full">
      {[55, 40, 25].map((r) => (
        <circle key={r} cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="1.5" opacity={0.5} />
      ))}
      <path d={arcPath} fill="none" stroke={color} strokeWidth="3" markerEnd={`url(#rot-${kind})`} />
      <text x="90" y="97" fontSize="26" fontWeight="700" fill={color} textAnchor="middle">
        {kind === 'low' ? 'L' : 'H'}
      </text>
      <defs>
        <marker id={`rot-${kind}`} markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill={color} />
        </marker>
      </defs>
    </svg>
  )
}
