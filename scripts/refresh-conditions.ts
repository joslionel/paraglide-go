// Fetches Open-Meteo forecasts for every site and writes computed On/Marginal/Off
// statuses. Run manually, or on a schedule (cron / Task Scheduler / later a
// Supabase Edge Function) every 30-60 min.
//
// When SUPABASE_SERVICE_ROLE_KEY is set (see .env.example, SETUP.md), sites
// are read from and conditions written to Supabase — this also picks up any
// member-added custom sites. Without it, falls back to the original local
// src/data/sites.json -> public/conditions_cache.json flow.
//
// Only sunrise-to-sunset hours are kept — paragliding is a daylight sport, and
// trimming the dead night hours cuts the cache size and the rows shown per day.
import { writeFileSync, readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { fetchForecast } from '../src/lib/openMeteo'
import { computeStatus, DEFAULT_THRESHOLDS } from '../src/lib/scoring'
import { hourOverlapsDaylight } from '../src/lib/daylight'
import type { Site, ConditionsCache, SiteConditions, HourlyCondition, DailyCondition } from '../src/lib/types'

try {
  process.loadEnvFile()
} catch {
  // no .env yet — fine, local-JSON mode doesn't need one
}

const FORECAST_DAYS = 5

/** Open-Meteo's hourly times are local (Europe/London); match "now" in that same zone. */
function currentLondonHourPrefix(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}`
}

async function computeSiteConditions(site: Site): Promise<SiteConditions | null> {
  if (site.lat === null || site.lon === null) {
    console.warn(`Skipping ${site.name}: no coordinates`)
    return null
  }
  if (site.missing_wind_dir || site.wind_dir_min === null || site.wind_dir_max === null) {
    console.warn(`Skipping conditions calc for ${site.name}: no wind direction window on file`)
    return null
  }

  const { hourly, sunTimes } = await fetchForecast(site.lat, site.lon, FORECAST_DAYS)
  const sunByDate = new Map(sunTimes.map((s) => [s.date, s]))

  const daylightHourly = hourly.filter((h) => {
    const sun = sunByDate.get(h.time.slice(0, 10))
    return sun ? hourOverlapsDaylight(h.time, sun.sunrise, sun.sunset) : true
  })

  const window = {
    dirMin: site.wind_dir_min,
    dirMax: site.wind_dir_max,
    speedMinMph: site.wind_speed_min_mph,
    speedMaxMph: site.wind_speed_max_mph,
  }

  const hourlyConditions: HourlyCondition[] = daylightHourly.map((h) => {
    const { status, reason, gustWarning } = computeStatus(
      {
        windSpeedMph: h.windSpeedMph,
        windGustMph: h.windGustMph,
        windDirectionDeg: h.windDirectionDeg,
        precipitationProbabilityPercent: h.precipitationProbabilityPercent,
      },
      window,
      DEFAULT_THRESHOLDS
    )
    return {
      time: h.time,
      status,
      reason,
      gust_warning: gustWarning,
      wind_speed_mph: Math.round(h.windSpeedMph * 10) / 10,
      wind_gust_mph: Math.round(h.windGustMph * 10) / 10,
      wind_direction_deg: h.windDirectionDeg,
      precipitation_probability_percent: h.precipitationProbabilityPercent,
    }
  })

  const byDate = new Map<string, HourlyCondition[]>()
  for (const h of hourlyConditions) {
    const date = h.time.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push(h)
  }

  const daily: DailyCondition[] = [...byDate.entries()].map(([date, hours]) => {
    const best = hours.reduce((acc, h) => {
      const rank = { on: 0, marginal: 1, off: 2, unknown: 3 }
      return rank[h.status] < rank[acc] ? h.status : acc
    }, 'off' as HourlyCondition['status'])
    return { date, status: best, hours }
  })

  const nowLondon = currentLondonHourPrefix()
  const nowEntry = hourlyConditions.find((h) => h.time.slice(0, 13) === nowLondon) ?? hourlyConditions[0] ?? null

  console.log(`${site.name}: now=${nowEntry?.status ?? 'n/a'} (${hourlyConditions.length} daylight hours)`)

  return { slug: site.slug, updated_at: new Date().toISOString(), now: nowEntry, daily }
}

async function runLocal() {
  const sites: Site[] = JSON.parse(readFileSync('src/data/sites.json', 'utf-8'))
  const cache: ConditionsCache = { generated_at: new Date().toISOString(), sites: {} }

  for (const site of sites) {
    try {
      const conditions = await computeSiteConditions(site)
      if (conditions) cache.sites[site.slug] = conditions
    } catch (err) {
      console.error(`Failed to fetch forecast for ${site.name}:`, err)
    }
  }

  writeFileSync('public/conditions_cache.json', JSON.stringify(cache, null, 2))
  console.log(`\nWrote conditions cache for ${Object.keys(cache.sites).length} sites (local JSON mode)`)
}

async function runSupabase(supabaseUrl: string, serviceRoleKey: string) {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: sites, error } = await supabase.from('sites').select('*')
  if (error) throw new Error(`Failed to load sites from Supabase: ${error.message}`)

  let written = 0
  for (const site of sites as Site[]) {
    try {
      const conditions = await computeSiteConditions(site)
      if (!conditions) continue
      const { error: upsertError } = await supabase.from('conditions_cache').upsert({
        slug: conditions.slug,
        updated_at: conditions.updated_at,
        now: conditions.now,
        daily: conditions.daily,
      })
      if (upsertError) throw upsertError
      written++
    } catch (err) {
      console.error(`Failed to refresh ${site.name}:`, err)
    }
  }

  console.log(`\nWrote conditions cache for ${written} sites (Supabase mode)`)
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceRoleKey) {
    await runSupabase(supabaseUrl, serviceRoleKey)
  } else {
    await runLocal()
  }
}

main()
