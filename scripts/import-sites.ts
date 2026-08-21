// One-time migration: pushes the scraped src/data/sites.json rows into the
// Supabase `sites` table. Run once after applying the migrations, before the
// first `npm run refresh` in Supabase mode. Safe to re-run — upserts on slug.
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import type { Site } from '../src/lib/types'

try {
  process.loadEnvFile()
} catch {
  // ignore — env vars may already be set in the shell
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env first.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const sites: Site[] = JSON.parse(readFileSync('src/data/sites.json', 'utf-8'))

  const { error, count } = await supabase.from('sites').upsert(sites, { onConflict: 'slug', count: 'exact' })
  if (error) {
    console.error('Import failed:', error.message)
    process.exit(1)
  }

  console.log(`Imported ${count ?? sites.length} sites into Supabase.`)
}

main()
