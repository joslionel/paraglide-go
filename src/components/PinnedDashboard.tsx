import { useState, Suspense } from 'react'
import type { Site, ConditionsCache } from '../lib/types'
import { PinnedSitesRose, type PinnedRoseSite } from './PinnedSitesRose'
import { PinnedSitesGrid } from './PinnedSitesGrid'
import { LazySiteDetailModal } from './LazySiteDetailModal'
import { MAX_PINS } from '../lib/dataStore'

export function PinnedDashboard({ pinnedSites, conditions }: { pinnedSites: Site[]; conditions: ConditionsCache | null }) {
  const [openDay, setOpenDay] = useState<{ site: Site; dayOffset: number } | null>(null)

  const roseSites: PinnedRoseSite[] = pinnedSites.map((site) => ({
    slug: site.slug,
    name: site.name,
    dirMin: site.wind_dir_min,
    dirMax: site.wind_dir_max,
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {pinnedSites.length} of {MAX_PINS} sites pinned — click the ☆ on any site card to pin or unpin.
        </p>
      </div>

      {pinnedSites.length > 0 && (
        <div className="mb-6 flex justify-center">
          <PinnedSitesRose sites={roseSites} />
        </div>
      )}

      <PinnedSitesGrid sites={pinnedSites} conditions={conditions} onOpenDay={(site, dayOffset) => setOpenDay({ site, dayOffset })} />

      {openDay && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/40" />}>
          <LazySiteDetailModal site={openDay.site} dayOffset={openDay.dayOffset} onClose={() => setOpenDay(null)} />
        </Suspense>
      )}
    </div>
  )
}
