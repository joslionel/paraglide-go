import { Fragment } from 'react'
import type { Site, ConditionsCache } from '../lib/types'
import { STATUS_DOT_BG, STATUS_SOLID_TEXT, STATUS_LABEL } from './StatusPill'
import { formatDayLabel, isToday } from '../lib/format'

const GRID_COLS = 'grid-cols-[minmax(110px,1fr)_repeat(7,minmax(60px,1fr))]'

export function PinnedSitesGrid({
  sites,
  conditions,
  onOpenDay,
  selected,
}: {
  sites: Site[]
  conditions: ConditionsCache | null
  onOpenDay: (site: Site, dayOffset: number) => void
  /** The cell currently expanded inline below the grid, if any — gets a ring so it's clear which cell the detail panel belongs to. */
  selected?: { slug: string; dayOffset: number } | null
}) {
  if (sites.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No pinned sites yet — click the ☆ on a site card to pin up to 6, and they'll show up here as a 7-day grid.
      </p>
    )
  }

  // Day labels come from whichever pinned site has the most daily entries,
  // since every site's cache should be in lockstep (same refresh run) but
  // this is a harmless safety net if one hasn't refreshed yet.
  const dayDates = sites
    .map((s) => conditions?.sites[s.slug]?.daily.map((d) => d.date) ?? [])
    .reduce((longest, days) => (days.length > longest.length ? days : longest), [] as string[])

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Forecast Conditions This Week</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Predicted flying status for each pinned site, day by day — tap any cell for the full hourly forecast.
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className={`grid ${GRID_COLS} min-w-[620px] gap-1.5`}>
          <div className="border-r border-slate-200 pr-2 pb-1 dark:border-slate-800" />
          {dayDates.map((date) => (
            <div key={date} className="pb-1 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
              {isToday(date) ? 'Today' : formatDayLabel(date).split(' ')[0]}
            </div>
          ))}

          {sites.map((site, siteIndex) => {
            const daily = conditions?.sites[site.slug]?.daily ?? []
            return (
              <Fragment key={site.slug}>
                <div className="flex items-center truncate border-r border-slate-200 pr-2 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                  {site.name}
                </div>
                {dayDates.map((date, dayOffset) => {
                  const day = daily.find((d) => d.date === date)
                  const isSelected = selected?.slug === site.slug && selected.dayOffset === dayOffset
                  return (
                    <button
                      key={`${site.slug}-${date}`}
                      onClick={() => onOpenDay(site, dayOffset)}
                      disabled={!day}
                      title={day ? `${site.name} — ${formatDayLabel(date)}: ${day.status}` : 'No data yet'}
                      className={`flex cursor-pointer items-center justify-center rounded-md py-2.5 text-[11px] font-semibold disabled:cursor-not-allowed ${
                        day
                          ? `${STATUS_DOT_BG[day.status]} ${STATUS_SOLID_TEXT[day.status]} hover:opacity-85`
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                      } ${isSelected ? 'ring-2 ring-slate-800 dark:ring-white' : ''}`}
                    >
                      {day ? STATUS_LABEL[day.status] : '–'}
                    </button>
                  )
                })}
                {siteIndex < sites.length - 1 && <div className="col-span-full border-b border-slate-200 dark:border-slate-800" />}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
