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
        ⟵ front moves this way
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
