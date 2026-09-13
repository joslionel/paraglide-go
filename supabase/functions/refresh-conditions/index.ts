// Refreshes conditions_cache from Open-Meteo. Two modes:
//   - POST {} (or no body) -> refresh every site. Used by the scheduled job.
//   - POST { slug: "..." } -> refresh just that one site and return its
//     computed conditions directly. Used by the client for "refresh this
//     card" and for pulling in a forecast right after a new site is added
//     (the scheduled job/cron might not run for up to 30 minutes otherwise).
//
// Deploy: `supabase functions deploy refresh-conditions`
// Secrets: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set automatically for
// Supabase-hosted functions).
//
// The scoring logic (direction/speed/gust/precip -> on/marginal/off) is
// intentionally duplicated from src/lib/scoring.ts rather than imported,
// since edge functions run on Deno and can't import the Vite app's TS
// directly without a build step — keep the two in sync by hand, or move
// scoring.ts to a shared package if this grows.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const FORECAST_DAYS = 7 // the pinned-sites dashboard shows a 7-day grid
const SINGLE_SITE_COOLDOWN_MS = 2 * 60 * 1000 // avoid refetching if a card was just refreshed

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

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
  gustAdvisoryOverCeilingMph: 0,
  gustMarginalOverCeilingMph: 6,
  directionMarginalDegrees: 15,
  precipMarginalPercent: 50,
}

type Status = 'on' | 'marginal' | 'off'
// One level more specific than Status — no "light" reason, a light breeze on
// the correct face is "on", not a go/no-go "off" (mirrors src/lib/scoring.ts;
// keep in sync by hand).
type Reason = 'on' | 'gusty' | 'marginal' | 'blown-out' | 'wrong-direction'
const severity: Record<Status, number> = { on: 0, marginal: 1, off: 2 }
const worseOf = (a: Status, b: Status) => (severity[a] >= severity[b] ? a : b)

function angularDistance(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180)
}

function speedStatus(
  speedMph: number,
  gustMph: number,
  window: { speedMinMph?: number | null; speedMaxMph?: number | null },
  t = DEFAULT_THRESHOLDS
): { status: Status; gusty: boolean } {
  const tooLight = window.speedMinMph ?? t.speedTooLightMph
  const onMin = window.speedMinMph ?? t.speedOnMinMph
  const ceiling = window.speedMaxMph ?? t.speedOnMaxMph

  // Base wind alone above the site's ceiling is blown out — no marginal
  // buffer zone here; that space is covered by the gust tiers below.
  if (speedMph > ceiling) return { status: 'off', gusty: false }

  let status: Status
  if (speedMph < tooLight) status = 'on' // calm but safe direction, just not enough to soar
  else if (speedMph < onMin) status = 'marginal' // not quite enough wind yet
  else status = 'on'

  // What matters for gust risk is whether a gust would itself reach the
  // site's blow-out ceiling, not how far above the moment's own (possibly
  // much lower) mean it is.
  const gustOverCeiling = gustMph - ceiling
  if (gustOverCeiling > t.gustMarginalOverCeilingMph) return { status: worseOf(status, 'marginal'), gusty: false }

  return { status, gusty: status === 'on' && gustOverCeiling > t.gustAdvisoryOverCeilingMph }
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
  // Buffer capped at a third of the arc's span so a narrow window (e.g.
  // 20-35°) keeps a genuine "on" zone instead of being marginal edge-to-edge.
  const marginalBuffer = Math.min(t.directionMarginalDegrees, span / 3)
  const direction: Status = !inArc ? 'off' : distToEdge <= marginalBuffer ? 'marginal' : 'on'

  const speedResult = speedStatus(reading.windSpeedMph, reading.windGustMph, window, t)
  let status = worseOf(direction, speedResult.status)
  if (status === 'on' && reading.precipitationProbabilityPercent >= t.precipMarginalPercent) status = 'marginal'

  let reason: Reason
  if (status === 'off') {
    reason = direction === 'off' ? 'wrong-direction' : 'blown-out'
  } else if (status === 'marginal') {
    reason = 'marginal'
  } else if (speedResult.gusty) {
    reason = 'gusty'
  } else {
    reason = 'on'
  }

  return { status, reason }
}

async function refreshSite(site: {
  slug: string
  lat: number | null
  lon: number | null
  missing_wind_dir: boolean
  wind_dir_min: number | null
  wind_dir_max: number | null
  wind_speed_min_mph: number | null
  wind_speed_max_mph: number | null
}) {
  if (site.lat == null || site.lon == null || site.missing_wind_dir) return null

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(site.lat))
  url.searchParams.set('longitude', String(site.lon))
  url.searchParams.set('hourly', 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability')
  url.searchParams.set('daily', 'sunrise,sunset')
  url.searchParams.set('wind_speed_unit', 'mph')
  url.searchParams.set('forecast_days', String(FORECAST_DAYS))
  url.searchParams.set('timezone', 'Europe/London')

  const res = await fetch(url.toString())
  if (!res.ok) return null
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

  return {
    slug: site.slug,
    updated_at: new Date().toISOString(),
    now: nowEntry,
    daily,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let slug: string | undefined
  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    slug = body?.slug ? String(body.slug) : undefined
  } catch {
    slug = undefined
  }

  if (slug) {
    const { data: existingCache } = await supabase.from('conditions_cache').select('updated_at').eq('slug', slug).maybeSingle()
    if (existingCache && Date.now() - new Date(existingCache.updated_at).getTime() < SINGLE_SITE_COOLDOWN_MS) {
      const { data: cached } = await supabase.from('conditions_cache').select('*').eq('slug', slug).single()
      return json({ updated: 0, cooldown: true, conditions: cached })
    }

    const { data: site, error } = await supabase.from('sites').select('*').eq('slug', slug).single()
    if (error || !site) return json({ error: 'Site not found' }, 404)

    const conditions = await refreshSite(site)
    if (!conditions) return json({ error: 'Site is missing coordinates or a wind-direction window' }, 400)

    const { error: upsertError } = await supabase.from('conditions_cache').upsert(conditions)
    if (upsertError) return json({ error: upsertError.message }, 500)

    return json({ updated: 1, conditions })
  }

  const { data: sites, error } = await supabase.from('sites').select('*')
  if (error) return json({ error: error.message }, 500)

  let updated = 0
  for (const site of sites ?? []) {
    try {
      const conditions = await refreshSite(site)
      if (!conditions) continue
      const { error: upsertError } = await supabase.from('conditions_cache').upsert(conditions)
      if (upsertError) throw upsertError
      updated++
    } catch (err) {
      console.error(`Failed to refresh ${site.slug}:`, err)
    }
  }

  return json({ updated })
})
