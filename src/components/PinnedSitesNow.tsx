import type { Site, ConditionsCache } from '../lib/types'
import { STATUS_DOT_BG, STATUS_TEXT, STATUS_BORDER_CLASS, STATUS_LABEL } from './StatusPill'
import { degToCompass } from '../lib/format'
import { useUnit } from '../lib/UnitContext'
import { formatSpeed, UNIT_LABELS } from '../lib/units'

/**
 * A live, at-a-glance snapshot of the current hour for each pinned site —
 * one compact card per site, colored by status, with the current wind
 * reading. Sits above the wind rose and the 7-day grid as the "check this
 * first" section of the dashboard.
 */
export function PinnedSitesNow({
  sites,
  conditions,
  onOpenSite,
}: {
  sites: Site[]
  conditions: ConditionsCache | null
  onOpenSite: (site: Site) => void
}) {
  const { unit } = useUnit()

  const rows = sites.map((site) => ({ site, now: conditions?.sites[site.slug]?.now ?? null }))
  const flyableCount = rows.filter((r) => r.now?.status === 'on' || r.now?.status === 'marginal').length

  return (
    <div className="mb-6">
      <div className="mb-3">
        <p className="text-xs font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-500">Flying now</p>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">What's flyable today.</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A live snapshot of your pinned sites from the current wind forecast — tap a card for the full hourly breakdown.
        </p>
      </div>

      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {flyableCount === 0
          ? 'No pinned sites in the flyable window right now — check the week ahead below.'
          : `${flyableCount} of ${sites.length} pinned site${sites.length === 1 ? '' : 's'} flyable right now.`}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map(({ site, now }) => {
          const status = now?.status ?? 'unknown'
          return (
            <button
              key={site.slug}
              onClick={() => onOpenSite(site)}
              className={`flex cursor-pointer items-center justify-between rounded-lg border-l-4 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${STATUS_BORDER_CLASS[status]}`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT_BG[status]}`} />
                  <span className="font-medium text-slate-800 dark:text-slate-100">{site.name}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {now
                    ? `${degToCompass(now.wind_direction_deg)} ${formatSpeed(now.wind_speed_mph, unit)} g${formatSpeed(now.wind_gust_mph, unit)} ${UNIT_LABELS[unit]}`
                    : 'No data yet'}
                </p>
              </div>
              <span className={`text-xs font-semibold tracking-wide uppercase ${STATUS_TEXT[status]}`}>{STATUS_LABEL[status]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
