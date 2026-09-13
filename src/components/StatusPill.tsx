import type { Status, Reason } from '../lib/scoring'

// Fixed, colorblind-validated status hues (not themed, not reused for anything
// else) — same three hexes read correctly on both light and dark surfaces:
// good #0ca30c, warning #fab219, critical #d03b3b, neutral #8b8d98.
// Tailwind needs each arbitrary-value class spelled out literally (it scans
// source text, not evaluated JS), so these are written out per key rather
// than built from a shared constant.

const STYLES: Record<Status, string> = {
  on: 'bg-[#0ca30c]/15 text-[#0ca30c] border-[#0ca30c]/40',
  marginal: 'bg-[#fab219]/15 text-[#946200] dark:text-[#fab219] border-[#fab219]/40',
  off: 'bg-[#d03b3b]/15 text-[#d03b3b] border-[#d03b3b]/40',
  unknown: 'bg-[#8b8d98]/15 text-[#8b8d98] border-[#8b8d98]/40',
}

export const STATUS_LABEL: Record<Status, string> = {
  on: 'On',
  marginal: 'Marginal',
  off: 'Off',
  unknown: 'No data',
}

/** `advisory` adds the amber "gusty" ring (see REASON_BORDER_CLASS) without changing the underlying status color. */
export function StatusPill({ status, size = 'md', advisory = false }: { status: Status; size?: 'sm' | 'md' | 'lg'; advisory?: boolean }) {
  const sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' }[size]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${STYLES[status]} ${sizeClasses} ${advisory ? 'ring-2 ring-inset ring-[#fab219]' : ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  )
}

export const STATUS_DOT_BG: Record<Status, string> = {
  on: 'bg-[#0ca30c]',
  marginal: 'bg-[#fab219]',
  off: 'bg-[#d03b3b]',
  unknown: 'bg-[#8b8d98]',
}

// Left-border accent for a status card (e.g. a "flying now" summary tile).
export const STATUS_BORDER_CLASS: Record<Status, string> = {
  on: 'border-[#0ca30c]',
  marginal: 'border-[#fab219]',
  off: 'border-[#d03b3b]',
  unknown: 'border-[#8b8d98]',
}

// Text color for use ON TOP of the solid STATUS_DOT_BG fills above (e.g. a
// fully-colored grid cell) — amber is light enough that white text fails
// contrast, so marginal gets dark text while on/off/unknown get white.
export const STATUS_SOLID_TEXT: Record<Status, string> = {
  on: 'text-white',
  marginal: 'text-slate-900',
  off: 'text-white',
  unknown: 'text-white',
}

export const STATUS_TEXT: Record<Status, string> = {
  on: 'text-[#0ca30c]',
  marginal: 'text-[#fab219]',
  off: 'text-[#d03b3b]',
  unknown: 'text-[#8b8d98]',
}

// One level more specific than Status — why a reading is "off", "marginal",
// or a flagged "on". No "light" reason: a light breeze on the correct face
// is "on", not a go/no-go "off" — see scoring.ts. Deliberately does NOT add
// more hues on top of the 3 status colors (that's what made on/light/
// wrong-direction hard to tell apart) — instead every "off" reason shares
// the same critical red and every "on" reason shares the same green, told
// apart by icon + label (and, for "gusty", a border accent) rather than a
// new hue, per the rule that status color never carries meaning alone.
export const REASON_LABEL: Record<Reason, string> = {
  on: 'On',
  gusty: 'Gusty',
  marginal: 'Marginal',
  'blown-out': 'Blown out',
  'wrong-direction': 'Off the hill',
}

export const REASON_ICON: Record<Reason, string> = {
  on: '✓',
  gusty: '✓',
  marginal: '!',
  'blown-out': '↑',
  'wrong-direction': '⊘',
}

export const REASON_TEXT: Record<Reason, string> = {
  on: 'text-[#0ca30c]',
  gusty: 'text-[#0ca30c]',
  marginal: 'text-[#946200] dark:text-[#fab219]',
  'blown-out': 'text-[#d03b3b]',
  'wrong-direction': 'text-[#d03b3b]',
}

export const REASON_DOT_BG: Record<Reason, string> = {
  on: 'bg-[#0ca30c]',
  gusty: 'bg-[#0ca30c]',
  marginal: 'bg-[#fab219]',
  'blown-out': 'bg-[#d03b3b]',
  'wrong-direction': 'bg-[#d03b3b]',
}

export const REASON_ROW_BG: Record<Reason, string> = {
  on: 'bg-[#0ca30c]/10',
  gusty: 'bg-[#0ca30c]/10',
  marginal: 'bg-[#fab219]/10',
  'blown-out': 'bg-[#d03b3b]/10',
  'wrong-direction': 'bg-[#d03b3b]/10',
}

// Advisory border accent — only "gusty" gets one, since it's the one reason
// that needs to stand out from a plain "on" without changing the underlying
// green (the gusts alone would justify caution even though the mean wind and
// direction are both fine).
export const REASON_BORDER_CLASS: Record<Reason, string> = {
  on: '',
  gusty: 'ring-2 ring-inset ring-[#fab219]',
  marginal: '',
  'blown-out': '',
  'wrong-direction': '',
}
