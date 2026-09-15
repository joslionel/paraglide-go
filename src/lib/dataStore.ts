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
import type { Site, ConditionsCache, SiteConditions, Profile, ReferralCode } from './types'

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

const MAX_PINS = 6

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

/** The signed-in user's own quotas/admin flag (My Dashboard, admin gating). Supabase-only — no local-JSON concept, since it requires an account. */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  return data as Profile | null
}

/** Referral codes the given user has created (used by the invite panel to show their status). */
export async function getReferralCodes(userId: string): Promise<ReferralCode[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('referral_codes').select('*').eq('created_by', userId).order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load referral codes: ${error.message}`)
  return data as ReferralCode[]
}

function randomReferralCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

/**
 * Creates a new single-use invite code owned by the given user. The RLS
 * insert policy (migration 0006) enforces the per-user quota server-side —
 * this just generates a short random code and retries once on the
 * astronomically unlikely chance of a collision with an existing one.
 */
export async function createReferralCode(userId: string): Promise<ReferralCode> {
  if (!supabase) throw new Error('Creating an invite link requires Supabase to be configured')

  for (let attempt = 0; attempt < 2; attempt++) {
    const code = randomReferralCode()
    const { data, error } = await supabase.from('referral_codes').insert({ code, created_by: userId, uses_remaining: 1 }).select().single()
    if (!error) return data as ReferralCode
    if (error.code !== '23505') throw new Error(error.message) // not a unique-violation — don't retry
  }
  throw new Error('Could not generate a unique invite code — try again.')
}

/** Every user's profile — admin-dashboard only; RLS only returns all rows to an admin (see is_admin() in migration 0006). */
export async function getAllProfiles(): Promise<Profile[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw new Error(`Failed to load accounts: ${error.message}`)
  return data as Profile[]
}

/** Admin-only: raise (or lower) another user's referral-code / custom-site quota. RLS restricts this update to admins and to just these two columns. */
export async function updateProfileQuotas(targetUserId: string, updates: { referral_code_quota?: number; custom_site_quota?: number }): Promise<void> {
  if (!supabase) throw new Error('Updating quotas requires Supabase to be configured')
  const { error } = await supabase.from('profiles').update(updates).eq('id', targetUserId)
  if (error) throw new Error(error.message)
}

export { isSupabaseConfigured, MAX_PINS }
