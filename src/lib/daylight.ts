// Pure string-based helpers for filtering hourly forecast rows down to daylight
// hours. Deliberately avoids Date parsing of Open-Meteo's local (Europe/London)
// timestamps — they carry no offset, so Date() would interpret them in the
// machine's own timezone instead. "YYYY-MM-DDTHH:MM" sorts lexically, so plain
// string comparison is both correct and timezone-safe.

/** Add one hour to a "YYYY-MM-DDTHH:MM" local timestamp, rolling over the date if needed. */
export function addOneHour(timeStr: string): string {
  const [datePart, timePart] = timeStr.split('T')
  const [h, m] = timePart.split(':').map(Number)
  if (h < 23) {
    return `${datePart}T${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const d = new Date(`${datePart}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  const nextDate = d.toISOString().slice(0, 10)
  return `${nextDate}T00:${String(m).padStart(2, '0')}`
}

/** Does the [hourTime, hourTime+1h) slot overlap [sunrise, sunset]? */
export function hourOverlapsDaylight(hourTime: string, sunrise: string, sunset: string): boolean {
  const hourEnd = addOneHour(hourTime)
  return hourTime < sunset && hourEnd > sunrise
}
