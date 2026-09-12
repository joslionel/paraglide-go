import type { Site, ConditionsCache } from '../lib/types'
import { distanceMiles } from '../lib/geo'
import { STATUS_DOT_BG } from './StatusPill'

const RADIUS_MILES = 50

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

  const nearby = sites
    .filter((s): s is Site & { lat: number; lon: number } => s.slug !== selected.slug && s.lat != null && s.lon != null)
    .map((site) => ({ site, miles: distanceMiles(selected.lat!, selected.lon!, site.lat, site.lon) }))
    .filter((r) => r.miles <= RADIUS_MILES)
    .sort((a, b) => a.miles - b.miles)

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Within {RADIUS_MILES} miles of {selected.name}
      </h3>
      {nearby.length === 0 ? (
        <p className="text-sm text-slate-400">No other sites within {RADIUS_MILES} miles.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {nearby.map(({ site, miles }) => {
            const status = conditions?.sites[site.slug]?.now?.status ?? 'unknown'
            return (
              <button
                key={site.slug}
                onClick={() => onSelect(site.slug)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_BG[status]}`} />
                  <span className="truncate font-medium text-slate-800 dark:text-slate-100">{site.name}</span>
                </span>
                <span className="shrink-0 pl-2 text-xs text-slate-400">{miles.toFixed(0)} mi</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
