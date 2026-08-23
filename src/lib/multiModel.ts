// Multi-model Open-Meteo fetch for the site detail modal only — lazy-loaded
// (called from a useEffect gated on the modal being open), one request per
// expand, for a single day (today by default, or any of the next 7 via
// dayOffset from the pinned-sites dashboard grid). Unlike the rest of the
// app, this runs client-side: it's the first place the browser calls
// Open-Meteo directly rather than reading a precomputed cache (see
// dataStore.ts's header comment).
import { hourOverlapsDaylight } from './daylight'

// The detail modal's hourly list is clamped to whichever is narrower: a
// practical flying-hours window (07:00-20:00) or the date's actual daylight
// (sunrise-sunset) — so a midsummer day doesn't run 06:00-20:30 and a
// midwinter day doesn't show pitch-dark hours either.
const DISPLAY_WINDOW_START_HOUR = 7
const DISPLAY_WINDOW_END_HOUR = 20

function withinDisplayWindow(time: string): boolean {
  const hour = parseInt(time.slice(11, 13), 10)
  return hour >= DISPLAY_WINDOW_START_HOUR && hour <= DISPLAY_WINDOW_END_HOUR
}

export type ModelId = 'gfs_seamless' | 'icon_seamless' | 'ukmo_seamless' | 'ecmwf_ifs025'

export const MODELS: ModelId[] = ['gfs_seamless', 'icon_seamless', 'ukmo_seamless', 'ecmwf_ifs025']

export const MODEL_LABELS: Record<ModelId, string> = {
  gfs_seamless: 'GFS',
  icon_seamless: 'ICON',
  ukmo_seamless: 'UKMO',
  ecmwf_ifs025: 'ECMWF',
}

// Standard Tailwind palette hexes (600 shade) — distinct, readable on both
// light and dark card backgrounds. Kept as raw hex (for SVG stroke/fill
// attributes) alongside the literal Tailwind classes below — Tailwind scans
// source text for class names, so a class string built from MODEL_COLORS at
// runtime wouldn't be picked up; each key needs its own literal class (same
// reason StatusPill.tsx's REASON_* maps are spelled out per-key).
export const MODEL_COLORS: Record<ModelId, string> = {
  gfs_seamless: '#2563eb', // blue
  icon_seamless: '#16a34a', // green
  ukmo_seamless: '#ea580c', // orange
  ecmwf_ifs025: '#7c3aed', // purple
}

export const MODEL_TEXT_CLASS: Record<ModelId, string> = {
  gfs_seamless: 'text-[#2563eb]',
  icon_seamless: 'text-[#16a34a]',
  ukmo_seamless: 'text-[#ea580c]',
  ecmwf_ifs025: 'text-[#7c3aed]',
}

export const MODEL_DOT_BG: Record<ModelId, string> = {
  gfs_seamless: 'bg-[#2563eb]',
  icon_seamless: 'bg-[#16a34a]',
  ukmo_seamless: 'bg-[#ea580c]',
  ecmwf_ifs025: 'bg-[#7c3aed]',
}

// Priority order for single-value ("reference model") quantities that aren't
// compared across models — thermal-index inputs, cloudbase, precipitation,
// and (via pickReferenceModelReading below) the wind reading used to score
// each hour on/marginal/off. Verified against a live Open-Meteo call that no
// one model reliably covers all of these for this region (e.g. ECMWF/ICON
// returned null boundary_layer_height for every hour tested; GFS had it but
// not cloud_base; UKMO had cloud_base but not boundary_layer_height) — this
// falls through the list per variable, per hour, independently.
export const REFERENCE_MODEL_PRIORITY: ModelId[] = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'ukmo_seamless']

/** First model in priority order with a usable speed+direction reading for this hour — speed/gust/direction come from the same model so they're physically self-consistent, unlike averaging across models. */
export function pickReferenceModelReading(models: ModelReading[]): ModelReading | undefined {
  for (const modelId of REFERENCE_MODEL_PRIORITY) {
    const reading = models.find((m) => m.model === modelId)
    if (reading && reading.windSpeedMph !== null && reading.windDirectionDeg !== null) return reading
  }
  return models.find((m) => m.windSpeedMph !== null && m.windDirectionDeg !== null)
}

const SCALAR_VARIABLES = [
  'cape',
  'boundary_layer_height',
  'freezing_level_height',
  'cloud_cover',
  'shortwave_radiation',
  'cloud_base',
  'temperature_2m',
  'dew_point_2m',
  'precipitation_probability',
  'precipitation',
] as const

export interface ModelReading {
  model: ModelId
  windSpeedMph: number | null
  windDirectionDeg: number | null
  windGustMph: number | null
}

export interface MultiModelHour {
  time: string // ISO local (Europe/London)
  models: ModelReading[]
  cape: number | null
  boundaryLayerHeightM: number | null
  freezingLevelHeightM: number | null
  cloudCoverPercent: number | null
  shortwaveRadiation: number | null
  cloudBaseM: number | null
  temperatureC: number | null
  dewPointC: number | null
  precipitationProbabilityPercent: number | null
  precipitationMm: number | null
}

export interface MultiModelForecast {
  date: string // YYYY-MM-DD, the day these hours belong to
  hours: MultiModelHour[] // daylight-trimmed
}

/**
 * @param dayOffset 0 = today, 1 = tomorrow, ... up to 6 (the dashboard's
 *   7-day grid). Fetches only as many days as needed for the requested one —
 *   asking for day 6 pulls 7 days total, not a fixed max every time.
 */
export async function fetchMultiModelForecast(lat: number, lon: number, dayOffset = 0): Promise<MultiModelForecast> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('models', MODELS.join(','))
  url.searchParams.set('hourly', ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', ...SCALAR_VARIABLES].join(','))
  url.searchParams.set('daily', 'sunrise,sunset')
  url.searchParams.set('wind_speed_unit', 'mph')
  url.searchParams.set('forecast_days', String(dayOffset + 1))
  url.searchParams.set('timezone', 'Europe/London')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo request failed (${res.status})`)
  const data = await res.json()

  const times: string[] = data.hourly.time
  const getSeries = (variable: string, model: ModelId): (number | null)[] =>
    data.hourly[`${variable}_${model}`] ?? new Array(times.length).fill(null)

  const windSpeed = Object.fromEntries(MODELS.map((m) => [m, getSeries('wind_speed_10m', m)])) as Record<ModelId, (number | null)[]>
  const windDir = Object.fromEntries(MODELS.map((m) => [m, getSeries('wind_direction_10m', m)])) as Record<ModelId, (number | null)[]>
  const windGust = Object.fromEntries(MODELS.map((m) => [m, getSeries('wind_gusts_10m', m)])) as Record<ModelId, (number | null)[]>

  const scalars: Record<string, Record<ModelId, (number | null)[]>> = {}
  for (const variable of SCALAR_VARIABLES) {
    scalars[variable] = Object.fromEntries(MODELS.map((m) => [m, getSeries(variable, m)])) as Record<ModelId, (number | null)[]>
  }

  const pickReference = (variable: string, i: number): number | null => {
    for (const model of REFERENCE_MODEL_PRIORITY) {
      const value = scalars[variable][model][i]
      if (value !== null && value !== undefined) return value
    }
    return null
  }

  let hours: MultiModelHour[] = times.map((time, i) => ({
    time,
    models: MODELS.map((model) => ({
      model,
      windSpeedMph: windSpeed[model][i] ?? null,
      windDirectionDeg: windDir[model][i] ?? null,
      windGustMph: windGust[model][i] ?? null,
    })),
    cape: pickReference('cape', i),
    boundaryLayerHeightM: pickReference('boundary_layer_height', i),
    freezingLevelHeightM: pickReference('freezing_level_height', i),
    cloudCoverPercent: pickReference('cloud_cover', i),
    shortwaveRadiation: pickReference('shortwave_radiation', i),
    cloudBaseM: pickReference('cloud_base', i),
    temperatureC: pickReference('temperature_2m', i),
    dewPointC: pickReference('dew_point_2m', i),
    precipitationProbabilityPercent: pickReference('precipitation_probability', i),
    precipitationMm: pickReference('precipitation', i),
  }))

  const targetDate: string = data.daily.time[dayOffset]
  const sunrise: string | undefined = data.daily?.sunrise?.[dayOffset]
  const sunset: string | undefined = data.daily?.sunset?.[dayOffset]
  hours = hours.filter((h) => {
    const sameDay = h.time.slice(0, 10) === targetDate
    const inDaylight = sunrise && sunset ? hourOverlapsDaylight(h.time, sunrise, sunset) : true
    return sameDay && inDaylight && withinDisplayWindow(h.time)
  })

  return { date: targetDate, hours }
}
