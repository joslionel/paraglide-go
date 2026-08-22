import { useEffect, useState, type ReactNode } from 'react'
import type { Site } from '../lib/types'
import {
  fetchMultiModelForecast,
  pickReferenceModelReading,
  MODELS,
  MODEL_LABELS,
  MODEL_DOT_BG,
  type MultiModelForecast,
  type MultiModelHour,
} from '../lib/multiModel'
import { computeConfidence, computeThermalIndex, computeCloudbaseFt, metersToFeet } from '../lib/raspProxy'
import { computeStatus, type Reason } from '../lib/scoring'
import { REASON_ROW_BG, REASON_TEXT, REASON_ICON, REASON_LABEL } from './StatusPill'
import { MultiModelWindRose } from './MultiModelWindRose'
import { SiteMap } from './SiteMap'
import { degToCompass, formatHour, currentLondonHourPrefix } from '../lib/format'
import { useUnit } from '../lib/UnitContext'
import { formatSpeed, UNIT_LABELS } from '../lib/units'

/**
 * Scores one hour the same on/marginal/off way the rest of the app does,
 * using whichever model's speed+direction+gust is available first in
 * REFERENCE_MODEL_PRIORITY (self-consistent — mixing speed from one model
 * with direction from another would be physically meaningless). Returns
 * null when there's nothing to score (no site window on file, or every
 * model came back null for this hour).
 */
function scoreHour(hour: MultiModelHour, site: Site): { reason: Reason } | null {
  if (site.wind_dir_min === null || site.wind_dir_max === null) return null
  const reference = pickReferenceModelReading(hour.models)
  if (!reference || reference.windSpeedMph === null || reference.windDirectionDeg === null) return null

  const { reason } = computeStatus(
    {
      windSpeedMph: reference.windSpeedMph,
      windGustMph: reference.windGustMph ?? reference.windSpeedMph,
      windDirectionDeg: reference.windDirectionDeg,
      precipitationProbabilityPercent: hour.precipitationProbabilityPercent ?? 0,
    },
    { dirMin: site.wind_dir_min, dirMax: site.wind_dir_max, speedMinMph: site.wind_speed_min_mph, speedMaxMph: site.wind_speed_max_mph }
  )
  return { reason }
}

// Best guess at rasp.stratus.org.uk's turnpoint page URL scheme — not
// independently verified against the live site. `rasp_turnpoint` should
// hold whatever identifier makes this resolve correctly; adjust the
// template below if the real path format turns out to differ.
const RASP_BASE_URL = 'https://rasp.stratus.org.uk'
function raspUrl(turnpoint: string): string {
  return `${RASP_BASE_URL}/${encodeURIComponent(turnpoint)}`
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{children}</div>
}

function Stat({ label, value, hint, dotClass }: { label: string; value: string; hint?: string; dotClass?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {dotClass && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{value}</div>
      {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
    </div>
  )
}

export function SiteDetailModal({ site, onClose }: { site: Site; onClose: () => void }) {
  const { unit } = useUnit()
  const [forecast, setForecast] = useState<MultiModelForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (site.lat === null || site.lon === null) {
      setError('This site has no coordinates on file.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')

    fetchMultiModelForecast(site.lat, site.lon)
      .then((result) => {
        if (cancelled) return
        setForecast(result)
        const nowPrefix = currentLondonHourPrefix()
        const idx = result.hours.findIndex((h) => h.time.startsWith(nowPrefix))
        setSelectedIndex(idx >= 0 ? idx : 0)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load forecast')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [site.lat, site.lon])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selectedHour = forecast?.hours[selectedIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{site.name}</h2>
            <p className="text-xs text-slate-400">Today only — multi-model wind confidence, thermal estimate, cloudbase</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading detailed forecast…</p>}

        {error && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
            Couldn't load detailed forecast: {error}.
          </div>
        )}

        {!loading && !error && forecast?.hours.length === 0 && (
          <p className="mt-6 text-sm text-slate-400">No daylight hours left today.</p>
        )}

        {!loading && !error && selectedHour && (
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex justify-center">
                  <MultiModelWindRose dirMin={site.wind_dir_min} dirMax={site.wind_dir_max} models={selectedHour.models} />
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {MODELS.map((m) => (
                    <span key={m} className="flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${MODEL_DOT_BG[m]}`} />
                      {MODEL_LABELS[m]}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {(['on', 'marginal', 'too-strong', 'wrong-direction'] as Reason[]).map((r) => (
                    <span key={r} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className={`font-bold ${REASON_TEXT[r]}`} aria-hidden="true">
                        {REASON_ICON[r]}
                      </span>
                      {REASON_LABEL[r]}
                    </span>
                  ))}
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
                  {forecast!.hours.map((h, i) => {
                    const reference = pickReferenceModelReading(h.models)
                    const scored = scoreHour(h, site)
                    return (
                      <button
                        key={h.time}
                        onClick={() => setSelectedIndex(i)}
                        className={`grid w-full cursor-pointer grid-cols-[1.1rem_2.75rem_1fr] items-center gap-2 px-2.5 py-1.5 text-left text-xs ${
                          scored ? REASON_ROW_BG[scored.reason] : ''
                        } ${
                          i === selectedIndex
                            ? 'ring-1 ring-inset ring-slate-400 dark:ring-slate-500'
                            : 'hover:ring-1 hover:ring-inset hover:ring-slate-200 dark:hover:ring-slate-700'
                        }`}
                      >
                        <span
                          className={`text-center font-bold ${scored ? REASON_TEXT[scored.reason] : 'text-slate-300 dark:text-slate-600'}`}
                          aria-hidden="true"
                        >
                          {scored ? REASON_ICON[scored.reason] : '·'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatHour(h.time)}</span>
                        <span className="text-right text-slate-500 dark:text-slate-400">
                          {reference?.windSpeedMph != null
                            ? `${formatSpeed(reference.windSpeedMph, unit)}${UNIT_LABELS[unit]} ${degToCompass(reference.windDirectionDeg ?? 0)}`
                            : 'n/a'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {(() => {
              const confidence = computeConfidence(selectedHour.models)
              const thermal = computeThermalIndex({
                boundaryLayerHeightM: selectedHour.boundaryLayerHeightM,
                cape: selectedHour.cape,
                shortwaveRadiation: selectedHour.shortwaveRadiation,
                cloudCoverPercent: selectedHour.cloudCoverPercent,
              })
              const cloudbaseFt = computeCloudbaseFt({
                cloudBaseM: selectedHour.cloudBaseM,
                temperatureC: selectedHour.temperatureC,
                dewPointC: selectedHour.dewPointC,
              })
              const freezingFt = metersToFeet(selectedHour.freezingLevelHeightM)

              return (
                <>
                  <div className="mt-4">
                    <SectionLabel>Conditions</SectionLabel>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <Stat
                        label="Confidence"
                        value={confidence.label}
                        hint={`±${Math.round(confidence.speedStddevMph)}mph, ±${Math.round(confidence.directionStddevDeg)}°`}
                      />
                      <Stat label="Thermal strength" value={thermal.label} hint={`index ${thermal.index}`} />
                      <Stat label="Cloudbase" value={cloudbaseFt !== null ? `${cloudbaseFt.toLocaleString()}ft` : 'n/a'} />
                      <Stat label="Freezing level" value={freezingFt !== null ? `${freezingFt.toLocaleString()}ft` : 'n/a'} />
                      <Stat
                        label="Rain chance"
                        value={selectedHour.precipitationProbabilityPercent !== null ? `${selectedHour.precipitationProbabilityPercent}%` : 'n/a'}
                      />
                      <Stat
                        label="Rain amount"
                        value={selectedHour.precipitationMm !== null ? `${selectedHour.precipitationMm}mm` : 'n/a'}
                      />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <SectionLabel>Per-model wind</SectionLabel>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {MODELS.map((m) => {
                        const reading = selectedHour.models.find((mm) => mm.model === m)
                        return (
                          <Stat
                            key={m}
                            label={MODEL_LABELS[m]}
                            dotClass={MODEL_DOT_BG[m]}
                            value={
                              reading?.windSpeedMph != null
                                ? `${formatSpeed(reading.windSpeedMph, unit)}${UNIT_LABELS[unit]} ${degToCompass(reading.windDirectionDeg ?? 0)}`
                                : 'n/a'
                            }
                          />
                        )
                      })}
                    </div>
                  </div>
                </>
              )
            })()}

            {site.lat !== null && site.lon !== null && (
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <SectionLabel>Location</SectionLabel>
                <SiteMap lat={site.lat} lon={site.lon} name={site.name} />
              </div>
            )}

            {site.rasp_turnpoint && (
              <a
                href={raspUrl(site.rasp_turnpoint)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                View on RASP ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
