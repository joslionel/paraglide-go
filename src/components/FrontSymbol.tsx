// Simple, schematic SVG renderings of the standard synoptic-chart symbols —
// deliberately plain/diagrammatic rather than literal chart excerpts, since
// these are used both in the course content and as quiz prompts (where a
// clean, unambiguous symbol matters more than realism).
const WARM = '#d03b3b'
const COLD = '#2563eb'
const OCCLUDED = '#9333ea'

export type FrontType = 'warm' | 'cold' | 'occluded' | 'stationary'

// 'stationary' is drawn specially (alternating warm/cold segments), so it has no single color of its own.
const FRONT_COLOR: Record<Exclude<FrontType, 'stationary'>, string> = { warm: WARM, cold: COLD, occluded: OCCLUDED }

function WarmMarkers({ color }: { color: string }) {
  // Semicircles bumped above the line, evenly spaced, pointing right (direction of travel).
  return (
    <>
      {[20, 60, 100].map((x) => (
        <path key={x} d={`M ${x - 10} 40 A 10 10 0 0 1 ${x + 10} 40`} fill={color} stroke="none" />
      ))}
    </>
  )
}

function ColdMarkers({ color }: { color: string }) {
  // Triangles pointing right, sitting on the line.
  return (
    <>
      {[20, 60, 100].map((x) => (
        <path key={x} d={`M ${x - 10} 40 L ${x + 8} 40 L ${x - 10} 26 Z`} fill={color} stroke="none" />
      ))}
    </>
  )
}

function OccludedMarkers({ color }: { color: string }) {
  // Alternating triangle / semicircle, both on the same side — the "combined" symbol.
  return (
    <>
      <path d="M 10 40 L 28 40 L 10 26 Z" fill={color} stroke="none" />
      <path d="M 50 40 A 10 10 0 0 1 70 40" fill={color} stroke="none" />
      <path d="M 90 40 L 108 40 L 90 26 Z" fill={color} stroke="none" />
    </>
  )
}

// Alternating warm (semicircles, above the line) and cold (triangles, below the line) segments,
// each in its own color — unlike an occluded front, the markers sit on OPPOSITE sides, since
// neither air mass is winning: the boundary is holding roughly still.
function StationarySymbol() {
  return (
    <>
      <line x1="0" y1="40" x2="43" y2="40" stroke={WARM} strokeWidth="2.5" />
      <path d="M 10 40 A 10 10 0 0 1 30 40" fill={WARM} stroke="none" />
      <line x1="43" y1="40" x2="87" y2="40" stroke={COLD} strokeWidth="2.5" />
      <path d="M 53 40 L 71 40 L 53 54 Z" fill={COLD} stroke="none" />
      <line x1="87" y1="40" x2="130" y2="40" stroke={WARM} strokeWidth="2.5" />
      <path d="M 97 40 A 10 10 0 0 1 117 40" fill={WARM} stroke="none" />
    </>
  )
}

/** A short stretch of front line with its markers, viewBox 0 0 130 58 — drop into any layout. */
export function FrontSymbol({ type, className }: { type: FrontType; className?: string }) {
  return (
    <svg viewBox="0 0 130 58" className={className} role="img" aria-label={`${type} front symbol`}>
      {type === 'stationary' ? (
        <StationarySymbol />
      ) : (
        <>
          <line x1="0" y1="40" x2="130" y2="40" stroke={FRONT_COLOR[type]} strokeWidth="2.5" />
          {type === 'warm' && <WarmMarkers color={FRONT_COLOR[type]} />}
          {type === 'cold' && <ColdMarkers color={FRONT_COLOR[type]} />}
          {type === 'occluded' && <OccludedMarkers color={FRONT_COLOR[type]} />}
        </>
      )}
    </svg>
  )
}

export { WARM as WARM_FRONT_COLOR, COLD as COLD_FRONT_COLOR, OCCLUDED as OCCLUDED_FRONT_COLOR }
