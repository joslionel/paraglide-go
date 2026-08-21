import { useState } from 'react'
import type { DailyCondition, HourlyCondition } from '../lib/types'
import type { Reason } from '../lib/scoring'
import { STATUS_DOT_BG, REASON_ROW_BG, REASON_TEXT, REASON_ICON, REASON_LABEL } from './StatusPill'
import { degToCompass, formatDayLabel, formatHour, isToday } from '../lib/format'
import { useUnit } from '../lib/UnitContext'
import { formatSpeed, UNIT_LABELS } from '../lib/units'

const MAX_WINDOW_LINES = 2

/** Separate contiguous "on" windows within the day's (already sunrise-sunset-trimmed) hours, e.g. ["11-13", "16-18"]. */
function onWindows(hours: HourlyCondition[]): string[] {
  const sorted = hours
    .map((h) => ({ hour: parseInt(h.time.slice(11, 13), 10), reason: h.reason }))
    .sort((a, b) => a.hour - b.hour)

  const windows: string[] = []
  let start: number | null = null
  let prevHour: number | null = null

  for (const { hour, reason } of sorted) {
    if (reason === 'on') {
      if (start === null) start = hour
      prevHour = hour
    } else if (start !== null) {
      windows.push(`${start}–${prevHour! + 1}`)
      start = null
    }
  }
  if (start !== null) windows.push(`${start}–${prevHour! + 1}`)

  return windows
}

const LEGEND: Reason[] = ['on', 'marginal', 'light', 'too-strong', 'wrong-direction']

const ROW_GRID_COLS = 'grid-cols-[1.1rem_2.75rem_2.75rem_2.25rem_2.5rem_2.5rem]'

export function ForecastStrip({ daily }: { daily: DailyCondition[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { unit } = useUnit()

  return (
    <div>
      <div className="flex gap-1.5">
        {daily.map((day) => {
          const windows = onWindows(day.hours)
          const shown = windows.slice(0, MAX_WINDOW_LINES)
          const extra = windows.length - shown.length

          return (
            <button
              key={day.date}
              onClick={() => setExpanded(expanded === day.date ? null : day.date)}
              className={`flex-1 rounded-lg border px-1 py-2 text-center transition-colors cursor-pointer ${
                expanded === day.date
                  ? 'border-current bg-black/5 dark:bg-white/10'
                  : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {isToday(day.date) ? 'Today' : formatDayLabel(day.date).split(' ')[0]}
              </div>
              <div className={`mx-auto mt-1 h-2.5 w-2.5 rounded-full ${STATUS_DOT_BG[day.status]}`} />
              <div className="mt-1 flex min-h-[1.9em] flex-col justify-center text-[9px] leading-tight tabular-nums text-slate-400 dark:text-slate-500">
                {shown.map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
                {extra > 0 && <span>+{extra} more</span>}
              </div>
            </button>
          )
        })}
      </div>

      {expanded && (
        <div className="mt-3 rounded-lg bg-black/5 p-3 text-sm dark:bg-white/5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {formatDayLabel(expanded)} <span className="font-normal text-slate-400">(speeds in {UNIT_LABELS[unit]})</span>
            </span>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {LEGEND.map((r) => (
                <span key={r} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className={`font-bold ${REASON_TEXT[r]}`} aria-hidden="true">
                    {REASON_ICON[r]}
                  </span>
                  {REASON_LABEL[r]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {daily
              .find((d) => d.date === expanded)
              ?.hours.map((h) => (
                <div
                  key={h.time}
                  className={`grid ${ROW_GRID_COLS} items-center gap-1 rounded px-1.5 py-1 text-xs ${REASON_ROW_BG[h.reason]}`}
                >
                  <span className={`text-center font-bold ${REASON_TEXT[h.reason]}`} aria-hidden="true">
                    {REASON_ICON[h.reason]}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{formatHour(h.time)}</span>
                  <span className="tabular-nums">{formatSpeed(h.wind_speed_mph, unit)}</span>
                  <span
                    className={`tabular-nums ${
                      h.gust_warning
                        ? 'font-bold text-[#946200] dark:text-[#fab219]'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    title={h.gust_warning ? 'Gusty — big spread relative to the mean, or a big gust outright' : undefined}
                  >
                    g{formatSpeed(h.wind_gust_mph, unit)}
                    {h.gust_warning && '⚠'}
                  </span>
                  <span>{degToCompass(h.wind_direction_deg)}</span>
                  <span className="text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {h.precipitation_probability_percent}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
