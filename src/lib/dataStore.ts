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

export { isSupabaseConfigured }
