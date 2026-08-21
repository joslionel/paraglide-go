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

const LABELS: Record<Status, string> = {
  on: 'On',
  marginal: 'Marginal',
  off: 'Off',
  unknown: 'No data',
}

export function StatusPill({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' }[size]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${STYLES[status]} ${sizeClasses}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  )
}

export const STATUS_DOT_BG: Record<Status, string> = {
  on: 'bg-[#0ca30c]',
  marginal: 'bg-[#fab219]',
  off: 'bg-[#d03b3b]',
  unknown: 'bg-[#8b8d98]',
}

export const STATUS_TEXT: Record<Status, string> = {
  on: 'text-[#0ca30c]',
  marginal: 'text-[#fab219]',
  off: 'text-[#d03b3b]',
  unknown: 'text-[#8b8d98]',
}

// One level more specific than Status — why a reading is "off" or "marginal".
// No "light" reason: a light breeze on the correct face is "on", not a
// go/no-go "off" — see scoring.ts. Deliberately does NOT add more hues on
// top of the 3 status colors (that's what made on/light/wrong-direction hard
// to tell apart) — instead every "off" reason shares the same critical red
// and is told apart by icon + label, per the rule that status color never
// carries meaning alone.
export const REASON_LABEL: Record<Reason, string> = {
  on: 'On',
  marginal: 'Marginal',
  'too-strong': 'Too high',
  'wrong-direction': 'Wrong direction',
}

export const REASON_ICON: Record<Reason, string> = {
  on: '✓',
  marginal: '!',
  'too-strong': '↑',
  'wrong-direction': '⊘',
}

export const REASON_TEXT: Record<Reason, string> = {
  on: 'text-[#0ca30c]',
  marginal: 'text-[#946200] dark:text-[#fab219]',
  'too-strong': 'text-[#d03b3b]',
  'wrong-direction': 'text-[#d03b3b]',
}

export const REASON_DOT_BG: Record<Reason, string> = {
  on: 'bg-[#0ca30c]',
  marginal: 'bg-[#fab219]',
  'too-strong': 'bg-[#d03b3b]',
  'wrong-direction': 'bg-[#d03b3b]',
}

export const REASON_ROW_BG: Record<Reason, string> = {
  on: 'bg-[#0ca30c]/10',
  marginal: 'bg-[#fab219]/10',
  'too-strong': 'bg-[#d03b3b]/10',
  'wrong-direction': 'bg-[#d03b3b]/10',
}
