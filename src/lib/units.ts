// Wind speeds are stored and scored in mph everywhere (Open-Meteo fetch,
// scoring.ts thresholds, the database) — this is purely a display-layer
// conversion, selected by the user and persisted locally.

export type SpeedUnit = 'mph' | 'kmh' | 'kn'

const MPH_TO: Record<SpeedUnit, number> = {
  mph: 1,
  kmh: 1.60934,
  kn: 0.868976,
}

export const UNIT_LABELS: Record<SpeedUnit, string> = {
  mph: 'mph',
  kmh: 'km/h',
  kn: 'kn',
}

export const UNIT_OPTIONS: SpeedUnit[] = ['mph', 'kmh', 'kn']

export function fromMph(mph: number, unit: SpeedUnit): number {
  return mph * MPH_TO[unit]
}

export function formatSpeed(mph: number, unit: SpeedUnit): string {
  return `${Math.round(fromMph(mph, unit))}`
}
