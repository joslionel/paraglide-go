// Scrapes the South West Wales Soaring Club site guides into
// scripts/output/swwsc.json for manual review before merging into
// src/data/sites.json. Kept separate from scrape-sites.ts (a different
// club's WordPress markup) and scrape-sewhgpgc.ts (a different club's
// WordPress markup again) — this one is a Wix site with no semantic HTML
// at all, so extraction works on the linear (tag-stripped) text in reading
// order rather than any DOM structure.
//
// Unlike SEWHGPGC, these pages give no lat/lon or OS grid reference
// anywhere — only What3Words addresses for parking/takeoff points, which
// would need a paid/keyed API to resolve. Coordinates here are geocoded via
// OpenStreetMap Nominatim (free, no key) against the site name, biased to a
// Wales bounding box. This is inherently best-effort for obscure hill
// names, so every result is logged with its match confidence for manual
// spot-checking before import — do not treat this file as ground truth.
import * as cheerio from 'cheerio'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'https://www.swwsc.co.uk'
const INDEX_URL = `${BASE}/site-guides`
// Roughly bounds Wales + the Marches, biasing Nominatim away from same-named places elsewhere.
const WALES_VIEWBOX = '-5.5,53.0,-2.3,51.2' // left,top,right,bottom

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
  club: string
  geocodeConfidence: string
}

// Two sites whose names don't resolve on Nominatim at all (neither the site
// name nor its parenthetical hill name is an indexed OSM place) — found by
// hand from each page's own text. Lletty Siac's guide says "follow
// directions for Bryncaws" (same hill, a different takeoff), and "Marros
// Down" is indexed as "Marros Mountain".
// Also covers cases where the "obvious" query resolves confidently but to the WRONG place —
// several of these hill names (Graig Fach/Fawr = "small/big crag", Bryn Mawr = "big hill",
// Rhiw Wen = "white slope") have namesakes all over Wales, and the primary site name can be a
// same-named town/hamlet far from the actual site too (e.g. there's an "Abernant" near
// Carmarthen town, 20+ miles from this one). Each override here was chosen by cross-checking
// the geocode result against the site's own driving directions text.
const MANUAL_GEOCODE_QUERY: Record<string, string> = {
  'Marros Down': 'Marros Mountain, Carmarthenshire',
  'Lletty Siac (Mynydd Marchywel)': 'Bryncaws, Neath Port Talbot',
  'Abernant (Bryn Mawr)': 'Cwmllynfell, Wales', // directions: Pontardawe -> towards Brynamman, uphill past Travellers Well pub — not the Carmarthen-town Abernant
  'Graig Fawr': 'Garnswllt, Wales', // directions: M4 J48 towards Pontarddulais/Garnswllt — not the Treorchy "Graig Fawr" of the same name
  'Rhiw Wen (Tair Carn Uchaf)': 'Tair Carn Uchaf, Wales', // directions: A4069 Black Mountain pass between Brynamman and Llangadog — the named peak is more precise than either town
}

function slugify(name: string): string {
  return `swwsc-${name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (paraglide-go site importer)' } })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

async function getSiteLinks(): Promise<string[]> {
  const html = await fetchHtml(INDEX_URL)
  const urls = new Set<string>()
  const re = /href="(https:\/\/www\.swwsc\.co\.uk\/site-guides\/[a-z0-9%()-]+)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) urls.add(m[1])
  return [...urls]
}

function linearLines(html: string): string[] {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<[^>]+>/g, '\n')
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8203;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#39;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/&pound;/g, '£')
    .replace(/​/g, '')
  return text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function parseWindRanges(raw: string): { min: number; max: number }[] {
  const ranges: { min: number; max: number }[] = []
  const rangeRe = /\((\d{2,3})\*?\s*-\s*(\d{2,3})\*?\)/g
  let m: RegExpExecArray | null
  // Normalize a literal 360 to 0 — the app's convention for "wraps through north" (see formatWindWindow), which some source pages don't follow.
  while ((m = rangeRe.exec(raw))) ranges.push({ min: parseInt(m[1], 10) % 360, max: parseInt(m[2], 10) % 360 })
  if (ranges.length === 0) {
    const singleRe = /\((\d{2,3})\*?\)/g
    while ((m = singleRe.exec(raw))) {
      const deg = parseInt(m[1], 10) % 360
      ranges.push({ min: deg, max: deg })
    }
  }
  return ranges
}

const SECTION_HEADINGS = ['Site information', 'Rules', 'Hazards', 'Directions', 'What3Words']

function extractSections(lines: string[]): Record<string, string> {
  const sections: Record<string, string[]> = {}
  let current: string | null = null
  for (const line of lines) {
    if (SECTION_HEADINGS.includes(line)) {
      current = line
      sections[current] = sections[current] ?? []
      continue
    }
    if (current) sections[current].push(line)
  }
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(sections)) out[k] = v.join(' ').trim()
  return out
}

interface GeocodeResult {
  lat: number
  lon: number
  displayName: string
  importance: number
}

async function geocode(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&viewbox=${WALES_VIEWBOX}&bounded=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'paraglide-go site importer (one-off script, contact via github.com/joslionel/paraglide-go)' } })
  if (!res.ok) return null
  const results = (await res.json()) as { lat: string; lon: string; display_name: string; importance: number }[]
  if (!results.length) return null
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), displayName: results[0].display_name, importance: results[0].importance }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function scrapeSite(url: string): Promise<ScrapedSite> {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)
  const lines = linearLines(html)

  const backIdx = lines.indexOf('< Back')
  const name = backIdx >= 0 ? lines[backIdx + 1] : $('title').text().split('|')[0].trim()
  const windLine = backIdx >= 0 ? lines[backIdx + 2] : ''
  const ratingLine = backIdx >= 0 ? lines[backIdx + 3] : ''
  const memberLine = backIdx >= 0 ? lines[backIdx + 4] : ''

  const windRanges = parseWindRanges(windLine)
  const primaryWind = windRanges[0] ?? null

  const membersOnly = /members only/i.test(memberLine)
  // A few pages repeat/garble this badge (e.g. "Club Pilot + 50h, +50h, Club Pilot") — the
  // first comma-separated segment is consistently the real, complete rating.
  const pgRating = ratingLine ? ratingLine.split(',')[0].trim() : null

  const heightIdx = lines.indexOf('Height')
  const heightFt = heightIdx >= 0 && /^\d+$/.test(lines[heightIdx + 1] ?? '') ? parseInt(lines[heightIdx + 1], 10) : null

  const landownerIdx = lines.indexOf('Landowner')
  const landowner = landownerIdx >= 0 ? lines[landownerIdx + 1] : null

  // The paragraph(s) between "General information" and "Landowner" carry the general take-off/landing description.
  const genInfoIdx = lines.indexOf('General information')
  let introText: string | null = null
  if (genInfoIdx >= 0 && landownerIdx > genInfoIdx) {
    // The description paragraph is the longest line in this span (the rest is short label/value noise).
    const span = lines.slice(genInfoIdx, landownerIdx + 2)
    const candidates = span.filter((l) => l.length > 60)
    if (candidates.length) introText = candidates[candidates.length - 1]
  }

  const sections = extractSections(lines)

  const notesParts: string[] = []
  if (heightFt != null) notesParts.push(`Take-off ${heightFt} ft amsl.`)
  if (landowner) notesParts.push(`Landowner: ${landowner}.`)
  if (introText) notesParts.push(introText)
  if (sections['Site information']) notesParts.push(`Site information: ${sections['Site information']}`)
  if (sections['Rules']) notesParts.push(`Rules: ${sections['Rules']}`)
  if (sections['Hazards']) notesParts.push(`Hazards: ${sections['Hazards']}`)
  if (sections['Directions']) notesParts.push(`Directions: ${sections['Directions']}`)
  if (windRanges.length > 1) notesParts.push(`Wind direction (site guide, multiple takeoffs): ${windLine}`)

  // Prefer the parenthetical hill/feature name for geocoding when present (e.g. "Cwmafan (Foel Fynyddau)" —
  // "Foel Fynyddau" is the actual named hill and geocodes far more reliably than the village name alone).
  // Prefer the PRIMARY name first: it's usually a specific village/place (Cwmparc, Newgale,
  // Ferryside...), whereas the parenthetical is often a generic Welsh hill name ("Graig Fach"
  // = "small crag", "Graig Fawr" = "big crag") that has namesakes all over Wales and can
  // silently geocode to the wrong one. Fall back to the parenthetical only if the primary
  // name doesn't resolve at all.
  const altNameMatch = name.match(/\(([^)]+)\)/)
  const primaryName = name.replace(/\s*\([^)]*\)/, '')
  const geocodeQuery = MANUAL_GEOCODE_QUERY[name] ?? `${primaryName}, Wales`
  let geo = await geocode(geocodeQuery)
  await sleep(1100)
  if (!geo && !MANUAL_GEOCODE_QUERY[name] && altNameMatch) {
    geo = await geocode(`${altNameMatch[1]}, Wales`)
    await sleep(1100)
  }

  return {
    slug: slugify(name),
    name,
    grid_ref: null,
    lat: geo ? Math.round(geo.lat * 1e6) / 1e6 : null,
    lon: geo ? Math.round(geo.lon * 1e6) / 1e6 : null,
    wind_dir_min: primaryWind?.min ?? null,
    wind_dir_max: primaryWind?.max ?? null,
    wind_speed_min_mph: null,
    wind_speed_max_mph: null,
    members_only: membersOnly,
    hg_rating: null,
    pg_rating: pgRating,
    liaison: null,
    notes: notesParts.join('\n\n'),
    source_url: url,
    missing_wind_dir: !primaryWind,
    club: 'SWWSC',
    geocodeConfidence: geo ? `${geo.importance.toFixed(3)} — ${geo.displayName}` : 'GEOCODE FAILED',
  }
}

async function main() {
  const links = await getSiteLinks()
  console.log(`Found ${links.length} site links`)

  const sites: ScrapedSite[] = []
  for (const url of links) {
    try {
      const site = await scrapeSite(url)
      sites.push(site)
      console.log(`Scraped ${site.name}${site.missing_wind_dir ? '  [MISSING WIND DIR]' : ''}${site.lat == null ? '  [GEOCODE FAILED]' : ''}`)
    } catch (err) {
      console.error(`Failed to scrape ${url}:`, err)
    }
  }

  sites.sort((a, b) => a.name.localeCompare(b.name))
  mkdirSync('scripts/output', { recursive: true })
  writeFileSync('scripts/output/swwsc.json', JSON.stringify(sites, null, 2))
  console.log(`\nWrote ${sites.length} sites to scripts/output/swwsc.json`)

  console.log('\nGeocode confidence (spot-check these against a map before importing):')
  for (const s of sites) console.log(`  - ${s.name}: ${s.geocodeConfidence}`)
}

main()
