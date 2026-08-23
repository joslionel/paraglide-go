import { Fragment } from 'react'
import type { Site, ConditionsCache } from '../lib/types'
import { STATUS_DOT_BG } from './StatusPill'
import { formatDayLabel, isToday } from '../lib/format'

const GRID_COLS = 'grid-cols-[minmax(110px,1fr)_repeat(7,minmax(40px,1fr))]'

export function PinnedSitesGrid({
  sites,
  conditions,
  onOpenDay,
}: {
  sites: Site[]
  conditions: ConditionsCache | null
  onOpenDay: (site: Site, dayOffset: number) => void
}) {
  if (sites.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No pinned sites yet — click the ☆ on a site card to pin up to 5, and they'll show up here as a 7-day grid.
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
    <div className="overflow-x-auto">
      <div className={`grid ${GRID_COLS} min-w-[560px] gap-y-1.5`}>
        <div />
        {dayDates.map((date) => (
          <div key={date} className="text-center text-[11px] text-slate-500 dark:text-slate-400">
            {isToday(date) ? 'Today' : formatDayLabel(date).split(' ')[0]}
          </div>
        ))}

        {sites.map((site) => {
          const daily = conditions?.sites[site.slug]?.daily ?? []
          return (
            <Fragment key={site.slug}>
              <div className="flex items-center truncate pr-2 text-sm font-medium text-slate-700 dark:text-slate-300">{site.name}</div>
              {dayDates.map((date, dayOffset) => {
                const day = daily.find((d) => d.date === date)
                return (
                  <button
                    key={`${site.slug}-${date}`}
                    onClick={() => onOpenDay(site, dayOffset)}
                    disabled={!day}
                    title={day ? `${site.name} — ${formatDayLabel(date)}: ${day.status}` : 'No data yet'}
                    className="flex cursor-pointer items-center justify-center rounded-md py-1.5 hover:bg-slate-100 disabled:cursor-not-allowed dark:hover:bg-slate-800"
                  >
                    <span className={`h-3 w-3 rounded-full ${day ? STATUS_DOT_BG[day.status] : 'bg-slate-200 dark:bg-slate-700'}`} />
                  </button>
                )
              })}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
