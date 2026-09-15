// Simple, schematic SVG renderings of the standard synoptic-chart symbols —
// deliberately plain/diagrammatic rather than literal chart excerpts, since
// these are used both in the course content and as quiz prompts (where a
// clean, unambiguous symbol matters more than realism).
const WARM = '#d03b3b'
const COLD = '#2563eb'
const OCCLUDED = '#9333ea'

export type FrontType = 'warm' | 'cold' | 'occluded'

const FRONT_COLOR: Record<FrontType, string> = { warm: WARM, cold: COLD, occluded: OCCLUDED }

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

/** A short stretch of front line with its markers, viewBox 0 0 130 50 — drop into any layout. */
export function FrontSymbol({ type, className }: { type: FrontType; className?: string }) {
  const color = FRONT_COLOR[type]
  return (
    <svg viewBox="0 0 130 50" className={className} role="img" aria-label={`${type} front symbol`}>
      <line x1="0" y1="40" x2="130" y2="40" stroke={color} strokeWidth="2.5" />
      {type === 'warm' && <WarmMarkers color={color} />}
      {type === 'cold' && <ColdMarkers color={color} />}
      {type === 'occluded' && <OccludedMarkers color={color} />}
    </svg>
  )
}

export { WARM as WARM_FRONT_COLOR, COLD as COLD_FRONT_COLOR, OCCLUDED as OCCLUDED_FRONT_COLOR }
