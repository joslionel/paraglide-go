// Supabase Edge Function stub for the scheduled refresh job (Step 5 of the spec).
// NOT deployed or tested yet — this is v1 scaffolding for when a Supabase
// project exists. Until then, `npm run refresh` (scripts/refresh-conditions.ts)
// does the same job locally and writes to public/conditions_cache.json.
//
// To activate:
//   1. `supabase functions deploy refresh-conditions`
//   2. Schedule it with `supabase functions schedule` (or pg_cron calling
//      `net.http_post` against this function) every 30-60 minutes.
//   3. Set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY as function secrets.
//
// The scoring logic (direction/speed/gust/precip -> on/marginal/off) is
// intentionally duplicated from src/lib/scoring.ts rather than imported,
// since edge functions run on Deno and can't import the Vite app's TS
// directly without a build step — keep the two in sync by hand, or move
// scoring.ts to a shared package if this grows.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const FORECAST_DAYS = 5

// Pure string comparison — Open-Meteo's local timestamps carry no offset, so
// Date() would misread them in the function's own runtime timezone. Mirrors
// src/lib/daylight.ts; keep the two in sync by hand.
function addOneHour(timeStr: string): string {
  const [datePart, timePart] = timeStr.split('T')
  const [h, m] = timePart.split(':').map(Number)
  if (h < 23) return `${datePart}T${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const d = new Date(`${datePart}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.toISOString().slice(0, 10)}T00:${String(m).padStart(2, '0')}`
}

function hourOverlapsDaylight(hourTime: string, sunrise: string, sunset: string): boolean {
  return hourTime < sunset && addOneHour(hourTime) > sunrise
}

const DEFAULT_THRESHOLDS = {
  speedTooLightMph: 5,
  speedOnMinMph: 8,
  speedOnMaxMph: 18,
  speedMarginalMaxMph: 22,
  gustSpreadOkMph: 5,
  gustRatioMax: 1.5,
  gustAbsoluteMaxMph: 18,
  directionMarginalDegrees: 15,
  precipMarginalPercent: 50,
}

type Status = 'on' | 'marginal' | 'off'
type Reason = 'on' | 'marginal' | 'light' | 'too-strong' | 'wrong-direction'
const severity: Record<Status, number> = { on: 0, marginal: 1, off: 2 }
const worseOf = (a: Status, b: Status) => (severity[a] >= severity[b] ? a : b)

function angularDistance(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180)
}

function computeStatus(
  reading: { windSpeedMph: number; windGustMph: number; windDirectionDeg: number; precipitationProbabilityPercent: number },
  window: { dirMin: number; dirMax: number; speedMinMph?: number | null; speedMaxMph?: number | null },
  t = DEFAULT_THRESHOLDS
): { status: Status; reason: Reason } {
  const span = (((window.dirMax - window.dirMin) % 360) + 360) % 360
  const offset = (((reading.windDirectionDeg - window.dirMin) % 360) + 360) % 360
  const inArc = span === 0 ? angularDistance(reading.windDirectionDeg, window.dirMin) < 0.01 : offset <= span
  const distToEdge = Math.min(offset, span - offset)
  const direction: Status = !inArc ? 'off' : distToEdge <= t.directionMarginalDegrees ? 'marginal' : 'on'

  const tooLight = window.speedMinMph ?? t.speedTooLightMph
  const onMin = window.speedMinMph ?? t.speedOnMinMph
  const onMax = window.speedMaxMph ?? t.speedOnMaxMph
  const marginalMax = window.speedMaxMph ?? t.speedMarginalMaxMph
  let speed: Status
  if (reading.windSpeedMph < tooLight) speed = 'off'
  else if (reading.windSpeedMph < onMin) speed = 'marginal'
  else if (reading.windSpeedMph <= onMax) speed = 'on'
  else if (reading.windSpeedMph <= marginalMax) speed = 'marginal'
  else speed = 'off'
  if (reading.windGustMph - reading.windSpeedMph > t.gustSpreadOkMph) speed = worseOf(speed, 'marginal')

  const ratioExceeded = reading.windSpeedMph > 0 && reading.windGustMph / reading.windSpeedMph > t.gustRatioMax
  if (ratioExceeded || reading.windGustMph > t.gustAbsoluteMaxMph) speed = worseOf(speed, 'off')

  let status = worseOf(direction, speed)
  if (status === 'on' && reading.precipitationProbabilityPercent >= t.precipMarginalPercent) status = 'marginal'

  let reason: Reason
  if (status === 'off') {
    reason = direction === 'off' ? 'wrong-direction' : reading.windSpeedMph < tooLight ? 'light' : 'too-strong'
  } else if (status === 'marginal') {
    reason = 'marginal'
  } else {
    reason = 'on'
  }

  return { status, reason }
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: sites, error } = await supabase.from('sites').select('*')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  let updated = 0
  for (const site of sites ?? []) {
    if (site.lat == null || site.lon == null || site.missing_wind_dir) continue

    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(site.lat))
    url.searchParams.set('longitude', String(site.lon))
    url.searchParams.set('hourly', 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability')
    url.searchParams.set('daily', 'sunrise,sunset')
    url.searchParams.set('wind_speed_unit', 'mph')
    url.searchParams.set('forecast_days', String(FORECAST_DAYS))
    url.searchParams.set('timezone', 'Europe/London')

    const res = await fetch(url.toString())
    if (!res.ok) continue
    const data = await res.json()

    const sunByDate = new Map<string, { sunrise: string; sunset: string }>(
      data.daily.time.map((date: string, i: number) => [date, { sunrise: data.daily.sunrise[i], sunset: data.daily.sunset[i] }])
    )

    const window = { dirMin: site.wind_dir_min, dirMax: site.wind_dir_max, speedMinMph: site.wind_speed_min_mph, speedMaxMph: site.wind_speed_max_mph }

    const daylightIndices = (data.hourly.time as string[])
      .map((time, i) => ({ time, i }))
      .filter(({ time }) => {
        const sun = sunByDate.get(time.slice(0, 10))
        return sun ? hourOverlapsDaylight(time, sun.sunrise, sun.sunset) : true
      })

    const hourly = daylightIndices.map(({ time, i }) => {
      const reading = {
        windSpeedMph: data.hourly.wind_speed_10m[i],
        windGustMph: data.hourly.wind_gusts_10m[i],
        windDirectionDeg: data.hourly.wind_direction_10m[i],
        precipitationProbabilityPercent: data.hourly.precipitation_probability[i],
      }
      const { status, reason } = computeStatus(reading, window)
      return {
        time,
        status,
        reason,
        wind_speed_mph: reading.windSpeedMph,
        wind_gust_mph: reading.windGustMph,
        wind_direction_deg: reading.windDirectionDeg,
        precipitation_probability_percent: reading.precipitationProbabilityPercent,
      }
    })

    const byDate = new Map<string, typeof hourly>()
    for (const h of hourly) {
      const date = h.time.slice(0, 10)
      if (!byDate.has(date)) byDate.set(date, [])
      byDate.get(date)!.push(h)
    }
    const daily = [...byDate.entries()].map(([date, hours]) => {
      const rank: Record<Status, number> = { on: 0, marginal: 1, off: 2 }
      const best = hours.reduce((acc: Status, h) => (rank[h.status as Status] < rank[acc] ? h.status : acc), 'off' as Status)
      return { date, status: best, hours }
    })

    const nowLondon = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date())
    const get = (type: string) => nowLondon.find((p) => p.type === type)!.value
    const nowPrefix = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}`
    const nowEntry = hourly.find((h) => h.time.slice(0, 13) === nowPrefix) ?? hourly[0] ?? null

    await supabase.from('conditions_cache').upsert({
      slug: site.slug,
      updated_at: new Date().toISOString(),
      now: nowEntry,
      daily,
    })
    updated++
  }

  return new Response(JSON.stringify({ updated }), { headers: { 'Content-Type': 'application/json' } })
})
