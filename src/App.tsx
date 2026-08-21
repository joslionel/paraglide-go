import { useCallback, useEffect, useState } from 'react'
import { getSites, getConditions, isSupabaseConfigured } from './lib/dataStore'
import type { Site, ConditionsCache } from './lib/types'
import { SiteCard } from './components/SiteCard'
import { UserMenu } from './components/UserMenu'
import { AddSiteForm } from './components/AddSiteForm'
import { UnitToggle } from './components/UnitToggle'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { UnitProvider, useUnit } from './lib/UnitContext'
import { formatSpeed, UNIT_LABELS } from './lib/units'

type Filter = 'all' | 'open' | 'members'

function DashboardContent() {
  const { user } = useAuth()
  const { unit } = useUnit()
  const [sites, setSites] = useState<Site[]>([])
  const [conditions, setConditions] = useState<ConditionsCache | null>(null)
  const [sitesError, setSitesError] = useState<string | null>(null)
  const [conditionsError, setConditionsError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const loadSites = useCallback(() => {
    getSites()
      .then((s) => {
        setSites(s)
        setSitesError(null)
      })
      .catch((err) => setSitesError(err.message))
  }, [])

  useEffect(() => {
    loadSites()
    getConditions()
      .then((c) => {
        setConditions(c)
        setConditionsError(null)
      })
      .catch((err) => setConditionsError(err.message))
  }, [loadSites, user])

  const visibleSites = sites.filter((s) => {
    if (filter === 'open') return !s.members_only
    if (filter === 'members') return s.members_only
    return true
  })

  const customSiteCount = user ? sites.filter((s) => s.is_custom && s.owner_id === user.id).length : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">Mid-Wales Paragliding Conditions</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Live-ish On / Marginal / Off status for Mid-Wales sites, from forecast wind vs. each site's known-good
                window.{' '}
                {conditions && <span>Last refreshed {new Date(conditions.generated_at).toLocaleString('en-GB')}.</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UnitToggle />
              <UserMenu />
            </div>
          </div>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
            Wind-window status is a simplification — always check each site's notes for rotor, hazards and local
            quirks before flying.
          </p>

          <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">What's the number in brackets? </span>
            Wind is shown as mean speed with the gust peak alongside — e.g.{' '}
            <span className="font-medium">
              {formatSpeed(4, unit)}
              {UNIT_LABELS[unit]} (g{formatSpeed(8, unit)})
            </span>{' '}
            means a {formatSpeed(4, unit)}
            {UNIT_LABELS[unit]} average with gusts up to {formatSpeed(8, unit)}
            {UNIT_LABELS[unit]}. The bigger that gap, the rougher and more turbulent the air: even when the average
            looks flyable, big gusts can trigger sudden surges or collapses. As a rule of thumb, gusts more than 1.5x
            the mean — or above about {formatSpeed(18, unit)}
            {UNIT_LABELS[unit]} outright — are generally a no-go, and that's built into the status.
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {(['all', 'open', 'members'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  filter === f
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {f === 'all' ? 'All sites' : f === 'open' ? 'Open' : 'Members only'}
              </button>
            ))}
          </div>
          {isSupabaseConfigured && user && <AddSiteForm remaining={5 - customSiteCount} onAdded={loadSites} />}
        </div>

        {isSupabaseConfigured && !user && (
          <p className="mb-4 text-xs text-slate-400">Log in to see members-only and member-added sites.</p>
        )}

        {sitesError && (
          <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
            Couldn't load sites: {sitesError}.
          </div>
        )}

        {conditionsError && (
          <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
            Couldn't load conditions cache: {conditionsError}. Run <code>npm run refresh</code> to generate it.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSites.map((site) => (
            <SiteCard key={site.slug} site={site} conditions={conditions?.sites[site.slug]} onChanged={loadSites} />
          ))}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <UnitProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </UnitProvider>
  )
}

export default App
