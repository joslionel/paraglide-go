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
