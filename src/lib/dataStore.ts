// Single seam between the dashboard and its data source.
//
// When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (see .env.example,
// SETUP.md), both functions read from Supabase — RLS on the `sites` table
// does the open-vs-members-only filtering for us (see
// supabase/migrations/0002_auth_and_custom_sites.sql), so a logged-out
// visitor's query just comes back with open sites only.
//
// Without those env vars the app falls back to the original local-JSON /
// static-file behaviour, so it keeps working before Supabase is wired up.
import sitesData from '../data/sites.json'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { Site, ConditionsCache, SiteConditions } from './types'

export async function getSites(): Promise<Site[]> {
  if (supabase) {
    const { data, error } = await supabase.from('sites').select('*').order('name')
    if (error) throw new Error(`Failed to load sites: ${error.message}`)
    return data as Site[]
  }
  return sitesData as Site[]
}

export async function getConditions(): Promise<ConditionsCache> {
  if (supabase) {
    const { data, error } = await supabase.from('conditions_cache').select('*')
    if (error) throw new Error(`Failed to load conditions cache: ${error.message}`)

    const sites: Record<string, SiteConditions> = {}
    let generatedAt = new Date(0).toISOString()
    for (const row of data ?? []) {
      sites[row.slug] = { slug: row.slug, updated_at: row.updated_at, now: row.now, daily: row.daily }
      if (row.updated_at > generatedAt) generatedAt = row.updated_at
    }
    return { generated_at: generatedAt, sites }
  }

  const res = await fetch(`/conditions_cache.json?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load conditions cache: ${res.status}`)
  return res.json()
}

/**
 * On-demand refresh for a single site — used by the manual refresh button and
 * right after a new site is added, rather than waiting for the next scheduled
 * `npm run refresh` / GitHub Actions cron run (up to 30 min away). Only works
 * in Supabase mode; the local-JSON fallback has no live function to call.
 * Server-side (via the refresh-conditions edge function) applies a short
 * cooldown per site, so rapid repeat clicks just return the cached result
 * instead of re-hitting Open-Meteo.
 */
export async function refreshSiteConditions(slug: string): Promise<SiteConditions> {
  if (!supabase) throw new Error('Refresh requires Supabase to be configured')

  const { data, error } = await supabase.functions.invoke('refresh-conditions', { body: { slug } })
  if (error) throw new Error(`Refresh failed: ${error.message}`)
  if (data?.error) throw new Error(data.error)
  return data.conditions as SiteConditions
}

const MAX_PINS = 5

/** Slugs the given user has pinned (My Dashboard tab). Supabase-only — no local-JSON pin concept, since pinning requires an account. */
export async function getPinnedSlugs(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('pinned_sites').select('slug').eq('user_id', userId)
  if (error) throw new Error(`Failed to load pinned sites: ${error.message}`)
  return (data ?? []).map((row) => row.slug as string)
}

export async function pinSite(userId: string, slug: string): Promise<void> {
  if (!supabase) throw new Error('Pinning requires Supabase to be configured')
  const { error } = await supabase.from('pinned_sites').insert({ user_id: userId, slug })
  if (error) throw new Error(error.message)
}

export async function unpinSite(userId: string, slug: string): Promise<void> {
  if (!supabase) throw new Error('Pinning requires Supabase to be configured')
  const { error } = await supabase.from('pinned_sites').delete().eq('user_id', userId).eq('slug', slug)
  if (error) throw new Error(error.message)
}

export { isSupabaseConfigured, MAX_PINS }
