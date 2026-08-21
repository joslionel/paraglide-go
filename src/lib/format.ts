const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

export function degToCompass(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16]
}

export function formatWindWindow(min: number | null, max: number | null): string {
  if (min === null || max === null) return 'unknown'
  // Display wrap-around arcs (e.g. 280-000) the way they're usually written (280-360).
  const displayMax = max === 0 && min > 0 ? 360 : max
  return `${String(min).padStart(3, '0')}–${String(displayMax).padStart(3, '0')}°`
}

export function formatDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatHour(timeStr: string): string {
  return timeStr.slice(11, 16)
}

export function isToday(dateStr: string): boolean {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
  return dateStr === today
}
