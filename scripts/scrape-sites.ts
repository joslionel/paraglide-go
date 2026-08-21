// Scrapes the Mid-Wales & Borders Soaring Club site pages into src/data/sites.json.
// Defensive parsing: the source site's markup is hand-authored and inconsistent
// (e.g. a stray second "Grid Ref:" label is actually used for PG rating on some pages).
import * as cheerio from 'cheerio'
import { writeFileSync } from 'fs'
import { osgb36GridRefToWgs84 } from '../src/lib/osgb'

const BASE = 'https://www.flymidwales.org.uk'
const INDEX_PAGES = [
  { url: `${BASE}/flying-sites/open-sites/`, membersOnly: false },
  { url: `${BASE}/flying-sites/members-only-sites/`, membersOnly: true },
]

interface ScrapedSite {
  slug: string
  name: string
  grid_ref: string | null
  lat: number | null
  lon: number | null
  wind_dir_min: number | null
  wind_dir_max: number | null
  wind_speed_min_mph: number | null
  wind_speed_max_mph: number | null
  members_only: boolean
  hg_rating: string | null
  pg_rating: string | null
  liaison: string | null
  notes: string
  source_url: string
  missing_wind_dir: boolean
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

async function getSiteLinks(indexUrl: string): Promise<{ name: string; url: string }[]> {
  const html = await fetchHtml(indexUrl)
  const $ = cheerio.load(html)
  const links = new Map<string, string>()
  const indexPath = new URL(indexUrl).pathname

  $('#content a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const abs = new URL(href, indexUrl).toString()
    const path = new URL(abs).pathname
    // Only follow links that are sub-pages of this index page (not the index itself, not siblings/parents)
    if (path.startsWith(indexPath) && path !== indexPath && path.split('/').filter(Boolean).length > indexPath.split('/').filter(Boolean).length) {
      const name = $(el).text().trim()
      if (name) links.set(abs, name)
    }
  })

  return [...links.entries()].map(([url, name]) => ({ url, name }))
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseWindDir(raw: string): { min: number; max: number } | null {
  const m = raw.trim().match(/^(\d{1,3})\s*-\s*(\d{1,3})$/)
  if (!m) return null
  const min = parseInt(m[1], 10)
  const max = parseInt(m[2], 10)
  if (min < 0 || min > 359 || max < 0 || max > 359) return null
  return { min, max }
}

async function scrapeSite(url: string, membersOnly: boolean): Promise<ScrapedSite> {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const name = $('.site-page-title h2').first().text().trim() || $('title').text().trim()

  // Each field is an <li class="w3-bar"><div class="w3-bar-item">[<span class="w3-large">Label:</span>] <span>value</span>...</div></li>
  const fields: { label: string | null; value: string }[] = []
  $('li.w3-bar > div.w3-bar-item').each((_, el) => {
    const $el = $(el)
    const labelSpan = $el.find('span.w3-large').first()
    const label = labelSpan.length ? labelSpan.text().replace(/:$/, '').trim() : null
    // value = text of the div minus the label span and any trailing image/icon span
    const clone = $el.clone()
    clone.find('span.w3-large').remove()
    clone.find('img').remove()
    clone.find('span.w3-right').remove()
    const value = clone.text().trim()
    if (value) fields.push({ label, value })
  })

  let gridRef: string | null = null
  let latLon: { lat: number; lon: number } | null = null
  let windDir: { min: number; max: number } | null = null
  let hgRating: string | null = null
  let pgRating: string | null = null
  let liaison: string | null = null

  for (const { label, value } of fields) {
    const latLonMatch = value.match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/)
    if (latLonMatch && !latLon) {
      latLon = { lat: parseFloat(latLonMatch[1]), lon: parseFloat(latLonMatch[2]) }
      continue
    }

    if (label === 'Grid Ref') {
      // Some pages misuse a second "Grid Ref:" label to hold the PG rating.
      if (/^[A-Z]{2}\d{4,10}$/i.test(value.replace(/\s+/g, ''))) {
        gridRef = value.replace(/\s+/g, '').toUpperCase()
      } else if (!pgRating) {
        pgRating = value
      }
      continue
    }

    if (label === 'Wind Dir') {
      windDir = parseWindDir(value)
      continue
    }

    if (label === 'HG Rating') {
      hgRating = value
      continue
    }

    if (label === 'PG Rating') {
      pgRating = value
      continue
    }

    if (label === 'Liaison') {
      liaison = value
      continue
    }
  }

  if (!latLon && gridRef) {
    latLon = osgb36GridRefToWgs84(gridRef)
  }

  const notesParts: string[] = []
  $('h3').each((_, el) => {
    const heading = $(el).text().trim()
    if (/^(Description|Access\s*&\s*parking)/i.test(heading)) {
      const p = $(el).next('p')
      const text = p.text().trim()
      if (text) notesParts.push(`${heading.replace(/:?\s*$/, '')}: ${text}`)
    }
  })

  return {
    slug: slugify(name),
    name,
    grid_ref: gridRef,
    lat: latLon?.lat ?? null,
    lon: latLon?.lon ?? null,
    wind_dir_min: windDir?.min ?? null,
    wind_dir_max: windDir?.max ?? null,
    wind_speed_min_mph: null,
    wind_speed_max_mph: null,
    members_only: membersOnly,
    hg_rating: hgRating,
    pg_rating: pgRating,
    liaison,
    notes: notesParts.join('\n\n'),
    source_url: url,
    missing_wind_dir: !windDir,
  }
}

async function main() {
  const allLinks: { name: string; url: string; membersOnly: boolean }[] = []
  for (const { url, membersOnly } of INDEX_PAGES) {
    const links = await getSiteLinks(url)
    for (const l of links) allLinks.push({ ...l, membersOnly })
    console.log(`${url} -> ${links.length} site links`)
  }

  const sites: ScrapedSite[] = []
  for (const { url, membersOnly, name } of allLinks) {
    try {
      const site = await scrapeSite(url, membersOnly)
      sites.push(site)
      console.log(`Scraped ${site.name}${site.missing_wind_dir ? '  [MISSING WIND DIR]' : ''}`)
    } catch (err) {
      console.error(`Failed to scrape ${name} (${url}):`, err)
    }
  }

  sites.sort((a, b) => a.name.localeCompare(b.name))

  writeFileSync('src/data/sites.json', JSON.stringify(sites, null, 2))
  console.log(`\nWrote ${sites.length} sites to src/data/sites.json`)

  const missing = sites.filter((s) => s.missing_wind_dir)
  if (missing.length) {
    console.log(`\n⚠ ${missing.length} site(s) missing wind direction data — fill in by hand:`)
    for (const s of missing) console.log(`  - ${s.name} (${s.source_url})`)
  }

  const missingLatLon = sites.filter((s) => s.lat === null || s.lon === null)
  if (missingLatLon.length) {
    console.log(`\n⚠ ${missingLatLon.length} site(s) missing lat/lon entirely:`)
    for (const s of missingLatLon) console.log(`  - ${s.name} (${s.source_url})`)
  }
}

main()
