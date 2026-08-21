// Pure calculation functions for the site detail modal's "RASP-proxy" panel
// — cross-model wind confidence, a rough thermal-strength heuristic, and
// cloudbase. All approximations; every threshold is a named constant so
// they can be tuned later against real-world outcomes, mirroring
// scoring.ts's DEFAULT_THRESHOLDS convention.
import type { ModelReading } from './multiModel'

// --- Wind confidence (cross-model agreement) --------------------------------

export type ConfidenceLabel = 'High' | 'Medium' | 'Low'

export interface ConfidenceThresholds {
  /** Speed stddev across models at/below this -> High agreement. */
  speedHighMaxMph: number
  /** Speed stddev at/below this (and above High) -> Medium; above -> Low. */
  speedMediumMaxMph: number
  /** Circular stddev of direction at/below this -> High agreement. */
  directionHighMaxDeg: number
  /** Circular stddev at/below this (and above High) -> Medium; above -> Low. */
  directionMediumMaxDeg: number
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  speedHighMaxMph: 2,
  speedMediumMaxMph: 5,
  directionHighMaxDeg: 15,
  directionMediumMaxDeg: 40,
}

const confidenceRank: Record<ConfidenceLabel, number> = { High: 0, Medium: 1, Low: 2 }
function worseConfidence(a: ConfidenceLabel, b: ConfidenceLabel): ConfidenceLabel {
  return confidenceRank[a] >= confidenceRank[b] ? a : b
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Circular standard deviation in degrees (Fisher's formula) — plain stddev is wrong for compass bearings (350° and 10° are 20° apart, not 340°). */
function circularStddevDeg(directionsDeg: number[]): number {
  if (directionsDeg.length === 0) return 0
  let sumCos = 0
  let sumSin = 0
  for (const d of directionsDeg) {
    const rad = (d * Math.PI) / 180
    sumCos += Math.cos(rad)
    sumSin += Math.sin(rad)
  }
  const n = directionsDeg.length
  const resultantLength = Math.sqrt((sumCos / n) ** 2 + (sumSin / n) ** 2)
  if (resultantLength < 1e-6) return 180 // fully scattered — cap at half the compass
  const sigmaRad = Math.sqrt(-2 * Math.log(Math.min(resultantLength, 1)))
  return Math.min((sigmaRad * 180) / Math.PI, 180)
}

export function computeConfidence(
  models: ModelReading[],
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS
): { label: ConfidenceLabel; speedStddevMph: number; directionStddevDeg: number } {
  const speeds = models.map((m) => m.windSpeedMph).filter((v): v is number => v !== null)
  const directions = models.map((m) => m.windDirectionDeg).filter((v): v is number => v !== null)

  const speedStddevMph = stddev(speeds)
  const directionStddevDeg = circularStddevDeg(directions)

  const speedLabel: ConfidenceLabel =
    speedStddevMph <= thresholds.speedHighMaxMph ? 'High' : speedStddevMph <= thresholds.speedMediumMaxMph ? 'Medium' : 'Low'
  const directionLabel: ConfidenceLabel =
    directionStddevDeg <= thresholds.directionHighMaxDeg ? 'High' : directionStddevDeg <= thresholds.directionMediumMaxDeg ? 'Medium' : 'Low'

  return { label: worseConfidence(speedLabel, directionLabel), speedStddevMph, directionStddevDeg }
}

// --- Thermal strength (RASP-proxy heuristic) --------------------------------

export type ThermalLabel = 'Weak' | 'Moderate' | 'Strong'

export interface ThermalInputs {
  boundaryLayerHeightM: number | null
  cape: number | null
  shortwaveRadiation: number | null
  cloudCoverPercent: number | null
}

/** Divisors that map each raw field onto a rough 0-1 "how strong" scale for this region. */
export const THERMAL_NORM_MAX = {
  boundaryLayerHeightM: 2500, // UK convective boundary-layer height rarely exceeds ~2500m
  cape: 800, // UK CAPE rarely exceeds ~800 J/kg (nothing like US Plains storm CAPE)
  shortwaveRadiation: 700, // W/m^2, rough clear-sky summer midday ceiling at this latitude
}

export const THERMAL_WEIGHTS = { blh: 0.5, cape: 0.3, sun: 0.2 }

export const THERMAL_BUCKETS = { weakMax: 0.3, moderateMax: 0.6 }

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Rough thermal-strength heuristic — NOT a real RASP/BLIPMAP model, just a
 * documented approximation from three Open-Meteo fields so it can be sanity
 * checked against known good/bad thermal days and retuned:
 *
 *   blh_norm  = clamp(boundary_layer_height / 2500, 0, 1)   -- mixing depth
 *   cape_norm = clamp(cape / 800, 0, 1)                      -- trigger/instability
 *   sun_norm  = clamp(shortwave_radiation / 700, 0, 1)       -- heating; falls back to
 *               (1 - cloud_cover/100) when no model has shortwave_radiation for this hour
 *
 *   thermal_index = blh_norm*0.5 + cape_norm*0.3 + sun_norm*0.2
 *
 *   < 0.3 -> Weak, 0.3-0.6 -> Moderate, > 0.6 -> Strong
 */
export function computeThermalIndex(inputs: ThermalInputs): { index: number; label: ThermalLabel } {
  const blhNorm = clamp01((inputs.boundaryLayerHeightM ?? 0) / THERMAL_NORM_MAX.boundaryLayerHeightM)
  const capeNorm = clamp01((inputs.cape ?? 0) / THERMAL_NORM_MAX.cape)
  const sunNorm =
    inputs.shortwaveRadiation !== null
      ? clamp01(inputs.shortwaveRadiation / THERMAL_NORM_MAX.shortwaveRadiation)
      : clamp01(1 - (inputs.cloudCoverPercent ?? 100) / 100)

  const index = blhNorm * THERMAL_WEIGHTS.blh + capeNorm * THERMAL_WEIGHTS.cape + sunNorm * THERMAL_WEIGHTS.sun
  const label: ThermalLabel = index < THERMAL_BUCKETS.weakMax ? 'Weak' : index < THERMAL_BUCKETS.moderateMax ? 'Moderate' : 'Strong'

  return { index: Math.round(index * 100) / 100, label }
}

// --- Cloudbase ---------------------------------------------------------------

export interface CloudbaseInputs {
  cloudBaseM: number | null
  temperatureC: number | null
  dewPointC: number | null
}

/** Classic dewpoint-spread cloudbase estimate: ~125m of lift per °C of temperature/dewpoint spread. */
const METERS_PER_DEGREE_SPREAD = 125

export const M_TO_FT = 3.28084

/** Cloudbase in feet — Open-Meteo's direct field when a model has it, else estimated from temperature/dewpoint spread. */
export function computeCloudbaseFt(inputs: CloudbaseInputs): number | null {
  const meters =
    inputs.cloudBaseM ??
    (inputs.temperatureC !== null && inputs.dewPointC !== null
      ? Math.max(0, (inputs.temperatureC - inputs.dewPointC) * METERS_PER_DEGREE_SPREAD)
      : null)
  return meters !== null ? Math.round(meters * M_TO_FT) : null
}

export function metersToFeet(m: number | null): number | null {
  return m !== null ? Math.round(m * M_TO_FT) : null
}
