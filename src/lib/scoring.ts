// Core On / Marginal / Off scoring logic for a paragliding site given a wind
// direction window and a weather reading. All thresholds are configurable —
// per-site wind speed bands override DEFAULT_THRESHOLDS' speed band, and every
// number here can be tuned as the user learns each hill's personality.

export type Status = 'on' | 'marginal' | 'off' | 'unknown'

/**
 * Why a reading is "off" or "marginal", one level more specific than Status —
 * lets the UI distinguish a calm day from a blown-out one from a wrong-direction one.
 */
export type Reason = 'on' | 'marginal' | 'light' | 'too-strong' | 'wrong-direction'

export interface Thresholds {
  /** Below this speed it's too light to soar at all. */
  speedTooLightMph: number
  /** At/above this speed (and below speedOnMaxMph) conditions are "on". */
  speedOnMinMph: number
  /** At/below this speed (and above speedOnMinMph) conditions are "on". */
  speedOnMaxMph: number
  /** Above this speed it's too strong, regardless of direction. */
  speedMarginalMaxMph: number
  /** Gust minus mean speed up to this is normal and doesn't downgrade anything. */
  gustSpreadOkMph: number
  /** Gust ÷ mean speed beyond this ratio is generally unflyable, regardless of the mean. */
  gustRatioMax: number
  /** Gust speed above this is a hard no-go, regardless of the mean or the ratio. */
  gustAbsoluteMaxMph: number
  /** Within this many degrees of either edge of the site's wind arc, direction is "marginal" instead of "on". */
  directionMarginalDegrees: number
  /** Precipitation probability (%) at/above which status is capped at "marginal". */
  precipMarginalPercent: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
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

export interface WindWindow {
  /** Start of the workable direction arc, degrees 0-359. */
  dirMin: number
  /** End of the workable direction arc, degrees 0-359. May wrap past 360/0 (e.g. 300 -> 30). */
  dirMax: number
  /** Per-site speed band override; falls back to DEFAULT_THRESHOLDS fields when absent. */
  speedMinMph?: number | null
  speedMaxMph?: number | null
}

export interface WeatherReading {
  windSpeedMph: number
  windGustMph: number
  windDirectionDeg: number
  precipitationProbabilityPercent: number
}

const severity: Record<Status, number> = { on: 0, marginal: 1, off: 2, unknown: 3 }

export function worseOf(a: Status, b: Status): Status {
  return severity[a] >= severity[b] ? a : b
}

/** Angular distance (0-180) between two compass bearings. */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(((a - b + 540) % 360) - 180)
  return diff
}

export function directionStatus(dirDeg: number, window: WindWindow, thresholds: Thresholds): Status {
  const { dirMin, dirMax } = window
  const span = ((dirMax - dirMin) % 360 + 360) % 360
  const offset = ((dirDeg - dirMin) % 360 + 360) % 360

  // span === 0 with dirMin !== dirMax is ambiguous scraped data; treat as "no arc data".
  const inArc = span === 0 ? angularDistance(dirDeg, dirMin) < 0.01 : offset <= span

  if (!inArc) return 'off'

  const distToEdge = Math.min(offset, span - offset)
  return distToEdge <= thresholds.directionMarginalDegrees ? 'marginal' : 'on'
}

export function speedStatus(speedMph: number, gustMph: number, window: WindWindow, thresholds: Thresholds): Status {
  const tooLight = window.speedMinMph ?? thresholds.speedTooLightMph
  const onMin = window.speedMinMph ?? thresholds.speedOnMinMph
  const onMax = window.speedMaxMph ?? thresholds.speedOnMaxMph
  const marginalMax = window.speedMaxMph ?? thresholds.speedMarginalMaxMph

  let status: Status
  if (speedMph < tooLight) status = 'off'
  else if (speedMph < onMin) status = 'marginal'
  else if (speedMph <= onMax) status = 'on'
  else if (speedMph <= marginalMax) status = 'marginal'
  else status = 'off'

  // A few mph of gust over the mean is normal; more than that is a soft downgrade.
  const gustSpread = gustMph - speedMph
  if (gustSpread > thresholds.gustSpreadOkMph) {
    status = worseOf(status, 'marginal')
  }

  // Two hard ceilings, either one forces a no-go regardless of the mean speed:
  // gusts much bigger than the mean (rule of thumb: >1.5x) are generally unflyable,
  // and a big enough gust in absolute terms is a no-go on its own.
  const ratioExceeded = speedMph > 0 && gustMph / speedMph > thresholds.gustRatioMax
  if (ratioExceeded || gustMph > thresholds.gustAbsoluteMaxMph) {
    status = worseOf(status, 'off')
  }

  return status
}

export function computeStatus(
  reading: WeatherReading,
  window: WindWindow,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): { status: Status; direction: Status; speed: Status; reason: Reason } {
  const direction = directionStatus(reading.windDirectionDeg, window, thresholds)
  const speed = speedStatus(reading.windSpeedMph, reading.windGustMph, window, thresholds)
  let status = worseOf(direction, speed)

  if (status === 'on' && reading.precipitationProbabilityPercent >= thresholds.precipMarginalPercent) {
    status = 'marginal'
  }

  let reason: Reason
  if (status === 'off') {
    const tooLight = window.speedMinMph ?? thresholds.speedTooLightMph
    reason = direction === 'off' ? 'wrong-direction' : reading.windSpeedMph < tooLight ? 'light' : 'too-strong'
  } else if (status === 'marginal') {
    reason = 'marginal'
  } else {
    reason = 'on'
  }

  return { status, direction, speed, reason }
}
