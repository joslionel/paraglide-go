import type { Site, ConditionsCache } from '../lib/types'
import { distanceMiles } from '../lib/geo'
import { STATUS_DOT_BG, STATUS_SOLID_TEXT } from './StatusPill'
import { dayLetter } from '../lib/format'

const RADIUS_MILES = 50
const MAX_NEARBY = 15

export function NearbySitesList({
  selected,
  sites,
  conditions,
  onSelect,
}: {
  selected: Site
  sites: Site[]
  conditions: ConditionsCache | null
  onSelect: (slug: string) => void
}) {
  if (selected.lat == null || selected.lon == null) return null

  const withinRadius = sites
    .filter((s): s is Site & { lat: number; lon: number } => s.slug !== selected.slug && s.lat != null && s.lon != null)
    .map((site) => ({ site, miles: distanceMiles(selected.lat!, selected.lon!, site.lat, site.lon) }))
    .filter((r) => r.miles <= RADIUS_MILES)
    .sort((a, b) => a.miles - b.miles)
  const nearby = withinRadius.slice(0, MAX_NEARBY)

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {withinRadius.length > MAX_NEARBY ? `Nearest ${MAX_NEARBY} sites to ${selected.name}` : `Within ${RADIUS_MILES} miles of ${selected.name}`}
      </h3>
      {nearby.length === 0 ? (
        <p className="text-sm text-slate-400">No other sites within {RADIUS_MILES} miles.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {nearby.map(({ site, miles }) => {
            const daily = conditions?.sites[site.slug]?.daily.slice(0, 7) ?? []
            return (
              <button
                key={site.slug}
                onClick={() => onSelect(site.slug)}
                className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-slate-800 dark:text-slate-100">{site.name}</span>
                  <span className="shrink-0 pl-2 text-xs text-slate-400">{miles.toFixed(0)} mi</span>
                </span>
                <span className="flex gap-0.5">
                  {daily.length > 0
                    ? daily.map((day) => (
                        <span
                          key={day.date}
                          title={`${dayLetter(day.date)}: ${day.status}`}
                          className={`flex h-5 flex-1 items-center justify-center rounded text-[10px] font-semibold ${STATUS_DOT_BG[day.status]} ${STATUS_SOLID_TEXT[day.status]}`}
                        >
                          {dayLetter(day.date)}
                        </span>
                      ))
                    : Array.from({ length: 7 }).map((_, i) => <span key={i} className="h-5 flex-1 rounded bg-slate-100 dark:bg-slate-800" />)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
