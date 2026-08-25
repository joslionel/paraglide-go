import type { Site, ConditionsCache } from '../lib/types'
import { REASON_ROW_BG, REASON_TEXT, REASON_ICON, REASON_LABEL, STATUS_LABEL } from './StatusPill'
import { degToCompass, formatHour, formatDayLabel, isToday } from '../lib/format'
import { useUnit } from '../lib/UnitContext'
import { formatSpeed, UNIT_LABELS } from '../lib/units'

/**
 * Inline hourly breakdown for one grid cell — the day's forecast hours from
 * the same cached conditions the grid itself is colored from (no extra
 * fetch), each tile colored/iconed the same way as the "what's flyable
 * today" cards. A link out to the full multi-model modal for anyone who
 * wants the deeper per-model comparison, thermal index, and map.
 */
export function PinnedWeekDetail({
  site,
  dayOffset,
  conditions,
  onOpenFullForecast,
  onClose,
}: {
  site: Site
  dayOffset: number
  conditions: ConditionsCache | null
  onOpenFullForecast: () => void
  onClose: () => void
}) {
  const { unit } = useUnit()
  const day = conditions?.sites[site.slug]?.daily[dayOffset]

  if (!day) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No forecast data for {site.name} yet.
      </div>
    )
  }

  const flyableHours = day.hours.filter((h) => h.status === 'on' || h.status === 'marginal')
  const windowText =
    flyableHours.length > 0 ? `window ${formatHour(flyableHours[0].time)}–${formatHour(flyableHours[flyableHours.length - 1].time)}` : null

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">
            {site.name} — {isToday(day.date) ? 'Today' : formatDayLabel(day.date)}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {STATUS_LABEL[day.status]}
            {windowText ? ` · ${windowText}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close hourly detail"
          className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {day.hours.length === 0 ? (
        <p className="text-sm text-slate-400">No daylight hours in the flying-hours window for that day.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {day.hours.map((h) => (
            <div key={h.time} className={`rounded-md px-2 py-1.5 text-xs ${REASON_ROW_BG[h.reason]}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatHour(h.time)}</span>
                <span className={`font-bold ${REASON_TEXT[h.reason]}`} title={REASON_LABEL[h.reason]} aria-hidden="true">
                  {REASON_ICON[h.reason]}
                </span>
              </div>
              <div className="mt-0.5 text-slate-600 dark:text-slate-400">
                {degToCompass(h.wind_direction_deg)} {formatSpeed(h.wind_speed_mph, unit)} g{formatSpeed(h.wind_gust_mph, unit)} {UNIT_LABELS[unit]}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onOpenFullForecast}
        className="mt-3 cursor-pointer text-sm font-medium text-slate-700 hover:underline dark:text-slate-300"
      >
        Open the {site.name} forecast →
      </button>
    </div>
  )
}
