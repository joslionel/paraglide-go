// Small schematic cloud icons for the cloud types covered in the course —
// shape and color are the distinguishing features (wispy/thin, flat layer,
// fluffy heap, tall and dark, or a mid-level sheet/patches), not
// photographic accuracy.
export type CloudType = 'cirrus' | 'stratus' | 'cumulus' | 'cumulonimbus' | 'altostratus' | 'altocumulus'

function CirrusShape() {
  return (
    <g stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M 10 45 Q 35 32 60 42 Q 85 52 110 36" />
      <path d="M 18 62 Q 42 52 65 60 Q 85 68 108 54" />
      <path d="M 15 78 Q 38 70 58 76" />
    </g>
  )
}

function StratusShape() {
  return (
    <g fill="#94a3b8">
      <rect x="8" y="42" width="104" height="16" rx="8" opacity={0.95} />
      <rect x="18" y="60" width="84" height="14" rx="7" opacity={0.7} />
      <rect x="26" y="76" width="68" height="12" rx="6" opacity={0.5} />
    </g>
  )
}

function CumulusShape() {
  return (
    <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5">
      <circle cx="36" cy="58" r="16" />
      <circle cx="60" cy="46" r="21" />
      <circle cx="85" cy="58" r="15" />
      <rect x="22" y="58" width="76" height="16" rx="8" />
    </g>
  )
}

function CumulonimbusShape() {
  return (
    <g>
      <g fill="#64748b" stroke="#475569" strokeWidth="1.5">
        <circle cx="44" cy="72" r="17" />
        <circle cx="68" cy="58" r="20" />
        <circle cx="90" cy="70" r="15" />
        <circle cx="60" cy="34" r="15" />
        <circle cx="76" cy="30" r="13" />
        <rect x="30" y="72" width="76" height="15" rx="7.5" />
      </g>
      <g stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 62 88 L 54 100 L 60 100 L 52 115" />
      </g>
      <g stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
        <line x1="36" y1="90" x2="31" y2="102" />
        <line x1="88" y1="90" x2="83" y2="102" />
      </g>
    </g>
  )
}

function AltostratusShape() {
  // A more uniform, denser mid-grey sheet than stratus — the sun looks like a dim disc through it.
  return (
    <g>
      <rect x="10" y="48" width="100" height="26" rx="13" fill="#7f8fa6" opacity={0.85} />
      <circle cx="60" cy="61" r="10" fill="#cbd5e1" opacity={0.5} />
    </g>
  )
}

function AltocumulusShape() {
  // Patchy, rippled mid-level clumps rather than a single sheet.
  return (
    <g fill="#94a3b8">
      <ellipse cx="30" cy="50" rx="14" ry="8" />
      <ellipse cx="55" cy="46" rx="15" ry="8" />
      <ellipse cx="80" cy="52" rx="13" ry="7" />
      <ellipse cx="40" cy="66" rx="13" ry="7" opacity={0.8} />
      <ellipse cx="68" cy="68" rx="14" ry="7" opacity={0.8} />
      <ellipse cx="93" cy="64" rx="11" ry="6" opacity={0.8} />
    </g>
  )
}

export function CloudIcon({ type, className }: { type: CloudType; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className ?? 'h-16 w-16'} role="img" aria-label={`${type} cloud`}>
      {type === 'cirrus' && <CirrusShape />}
      {type === 'stratus' && <StratusShape />}
      {type === 'cumulus' && <CumulusShape />}
      {type === 'cumulonimbus' && <CumulonimbusShape />}
      {type === 'altostratus' && <AltostratusShape />}
      {type === 'altocumulus' && <AltocumulusShape />}
    </svg>
  )
}
