export interface HourlyForecast {
  time: string // ISO, local (Europe/London)
  windSpeedMph: number
  windGustMph: number
  windDirectionDeg: number
  precipitationProbabilityPercent: number
}

export interface DailySunTimes {
  date: string // YYYY-MM-DD
  sunrise: string // ISO, local (Europe/London)
  sunset: string // ISO, local (Europe/London)
}

export interface ForecastResult {
  hourly: HourlyForecast[]
  sunTimes: DailySunTimes[]
}

export async function fetchForecast(lat: number, lon: number, forecastDays = 5): Promise<ForecastResult> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lon.toString())
  url.searchParams.set('hourly', 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability')
  url.searchParams.set('daily', 'sunrise,sunset')
  url.searchParams.set('wind_speed_unit', 'mph')
  url.searchParams.set('forecast_days', forecastDays.toString())
  url.searchParams.set('timezone', 'Europe/London')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo request failed (${res.status}) for ${lat},${lon}`)
  const data = await res.json()

  const times: string[] = data.hourly.time
  const speeds: number[] = data.hourly.wind_speed_10m
  const dirs: number[] = data.hourly.wind_direction_10m
  const gusts: number[] = data.hourly.wind_gusts_10m
  const precip: number[] = data.hourly.precipitation_probability

  const hourly = times.map((time, i) => ({
    time,
    windSpeedMph: speeds[i],
    windGustMph: gusts[i],
    windDirectionDeg: dirs[i],
    precipitationProbabilityPercent: precip[i],
  }))

  const dailyTimes: string[] = data.daily.time
  const sunrises: string[] = data.daily.sunrise
  const sunsets: string[] = data.daily.sunset
  const sunTimes = dailyTimes.map((date, i) => ({ date, sunrise: sunrises[i], sunset: sunsets[i] }))

  return { hourly, sunTimes }
}
