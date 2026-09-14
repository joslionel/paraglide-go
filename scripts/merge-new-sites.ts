// One-off: merges the scraped SWWSC and SEWHGPGC site lists into
// src/data/sites.json, normalizing them to the full Site shape and
// stripping the scraper-only QA fields (club, rawWindDirection,
// ambiguousWind, geocodeConfidence). Run once; not part of the regular
// scrape/import pipeline.
import { readFileSync, writeFileSync } from 'fs'
import type { Site } from '../src/lib/types'

const existing: Site[] = JSON.parse(readFileSync('src/data/sites.json', 'utf-8'))
const swwsc = JSON.parse(readFileSync('scripts/output/swwsc.json', 'utf-8'))
const sewhgpgc = JSON.parse(readFileSync('scripts/output/sewhgpgc.json', 'utf-8'))

function toSite(raw: any): Site {
  return {
    slug: raw.slug,
    name: raw.name,
    grid_ref: raw.grid_ref,
    lat: raw.lat,
    lon: raw.lon,
    wind_dir_min: raw.wind_dir_min,
    wind_dir_max: raw.wind_dir_max,
    wind_speed_min_mph: raw.wind_speed_min_mph,
    wind_speed_max_mph: raw.wind_speed_max_mph,
    members_only: raw.members_only,
    hg_rating: raw.hg_rating,
    pg_rating: raw.pg_rating,
    liaison: raw.liaison,
    notes: raw.notes,
    source_url: raw.source_url,
    missing_wind_dir: raw.missing_wind_dir,
    owner_id: null,
    is_custom: false,
    rasp_turnpoint: null,
  }
}

const newSites = [...swwsc, ...sewhgpgc].map(toSite)

const existingSlugs = new Set(existing.map((s) => s.slug))
const collisions = newSites.filter((s) => existingSlugs.has(s.slug))
if (collisions.length) {
  console.error(
    'Slug collisions with existing sites — aborting:',
    collisions.map((s) => s.slug)
  )
  process.exit(1)
}

const merged = [...existing, ...newSites].sort((a, b) => a.name.localeCompare(b.name))
writeFileSync('src/data/sites.json', JSON.stringify(merged, null, 2) + '\n')
console.log(`Merged ${newSites.length} new sites (${swwsc.length} SWWSC + ${sewhgpgc.length} SEWHGPGC) into src/data/sites.json — ${merged.length} total.`)

const noWindOrLatLon = newSites.filter((s) => s.missing_wind_dir || s.lat == null)
if (noWindOrLatLon.length) {
  console.log('\n⚠ Still missing wind direction or lat/lon (manual follow-up):')
  for (const s of noWindOrLatLon) console.log(`  - ${s.name}`)
}
