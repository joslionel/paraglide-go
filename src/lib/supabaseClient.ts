import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// Until a Supabase project is wired up (see SETUP.md), the app runs entirely
// on the local JSON/static-file data source in dataStore.ts and auth/write
// features stay hidden — this client is only ever touched when configured.
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url, anonKey) : null
