// Scrapes the South East Wales Hang Gliding & Paragliding Club site guides
// into scripts/output/sewhgpgc.json for manual review before merging into
// src/data/sites.json. Kept separate from scrape-sites.ts, which targets a
// completely different club site's markup (flymidwales.org.uk).
//
// This club's site pages are unusually well-structured: a plain HTML table
// of <td><strong>Label:</strong>value</td> cells gives exact lat/lon (no
// geocoding needed), heights (including top-to-bottom), wind direction, and
// ratings directly. Prose sections (Take-off, Landing, Hazards, etc.) are
// extracted from the linear (tag-stripped) reading order of the page, which
// matches the page's actual HTML source order — the DOM itself mixes tab
// and accordion widgets whose *source* order doesn't match a naive
// `$('h2,h4')` query's concatenated-by-tag order, so text-order splitting
// on known heading strings is more reliable here than DOM traversal.
import * as cheerio from 'cheerio'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'https://www.flysouthwales.co.uk'
const INDEX_URL = `${BASE}/site-guides/`

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
}

const COMPASS_DEG: Record<string, number> = {
  NNE: 22.5, ENE: 67.5, ESE: 112.5, SSE: 157.5, SSW: 202.5, WSW: 247.5, WNW: 292.5, NNW: 337.5,
  NE: 45, SE: 135, SW: 225, NW: 315,
  N: 0, E: 90, S: 180, W: 270,
}
// Longest tokens first so "NNE" matches before "NE"/"N" would otherwise eat part of it.
const COMPASS_TOKENS = Object.keys(COMPASS_DEG).sort((a, b) => b.length - a.length)
const COMPASS_RE = new RegExp(`\\b(${COMPASS_TOKENS.join('|')})\\b`, 'g')

function extractCompassPoints(raw: string): number[] {
  const points: number[] = []
  let m: RegExpExecArray | null
  COMPASS_RE.lastIndex = 0
  while ((m = COMPASS_RE.exec(raw.toUpperCase()))) points.push(COMPASS_DEG[m[1]])
  return [...new Set(points)]
}

/** Smallest arc (going clockwise, wrapping through 360 if needed) that encloses every point — the complement of the single largest circular gap between consecutive points. With only 2 points this is ambiguous by construction (either arc "encloses" both endpoints); callers should sanity-check against a best-direction hint in that case. */
function minimalEnclosingArc(points: number[]): { min: number; max: number } | null {
  if (points.length === 0) return null
  if (points.length === 1) return { min: points[0], max: points[0] }
  const sorted = [...points].sort((a, b) => a - b)
  let bestGapIdx = 0
  let bestGap = -1
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i]
    const b = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360
    const gap = b - a
    if (gap > bestGap) {
      bestGap = gap
      bestGapIdx = i
    }
  }
  const startIdx = (bestGapIdx + 1) % sorted.length
  return { min: Math.round(sorted[startIdx]) % 360, max: Math.round(sorted[bestGapIdx]) % 360 }
}

function arcContains(min: number, max: number, deg: number): boolean {
  if (min <= max) return deg >= min && deg <= max
  return deg >= min || deg <= max
}

function parseWindDirection(raw: string, bestRaw: string | null): { min: number; max: number } | null {
  const points = extractCompassPoints(raw)
  if (points.length === 0) return null
  if (points.length === 2) {
    // Two possible arcs between two points — disambiguate with "Best Direction" if we can.
    const [a, b] = points
    const arc1 = a <= b ? { min: a, max: b } : { min: b, max: a }
    const arc2 = { min: arc1.max, max: arc1.min } // the complementary wrap-around arc
    const bestPoints = bestRaw ? extractCompassPoints(bestRaw) : []
    const round = (arc: { min: number; max: number }) => ({ min: Math.round(arc.min) % 360, max: Math.round(arc.max) % 360 })
    if (bestPoints.length > 0) {
      const arc1Hits = bestPoints.filter((p) => arcContains(arc1.min, arc1.max, p)).length
      const arc2Hits = bestPoints.filter((p) => arcContains(arc2.min, arc2.max, p)).length
      if (arc2Hits > arc1Hits) return round(arc2)
    }
    return round(arc1)
  }
  return minimalEnclosingArc(points)
}

function parseLatLon(latRaw: string, lonRaw: string): { lat: number; lon: number } | null {
  const latMatches = [...latRaw.matchAll(/([NS])\s*(\d+\.\d+)/gi)]
  const lonMatches = [...lonRaw.matchAll(/([EW])\s*(\d+\.\d+)/gi)]
  if (!latMatches.length || !lonMatches.length) return null
  const lats = latMatches.map((m) => (m[1].toUpperCase() === 'S' ? -1 : 1) * parseFloat(m[2]))
  const lons = lonMatches.map((m) => (m[1].toUpperCase() === 'W' ? -1 : 1) * parseFloat(m[2]))
  const lat = lats.reduce((a, b) => a + b, 0) / lats.length
  const lon = lons.reduce((a, b) => a + b, 0) / lons.length
  return { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 }
}

function parseFeet(raw: string | undefined): number | null {
  if (!raw) return null
  const m = raw.replace(/,/g, '').match(/(-?\d+(\.\d+)?)/)
  return m ? Math.round(parseFloat(m[1])) : null
}

function slugify(name: string): string {
  return `sewhgpgc-${name
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
  const re = /href="(https:\/\/www\.flysouthwales\.co\.uk\/site-guides\/[a-z0-9-]+\/)"/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) urls.add(m[1])
  return [...urls]
}

function extractTableFields($: cheerio.CheerioAPI): Record<string, string> {
  const fields: Record<string, string> = {}
  $('td').each((_, el) => {
    const $el = $(el)
    const label = $el.find('strong').first().text().replace(/:\s*$/, '').trim()
    if (!label) return
    const clone = $el.clone()
    clone.find('strong').remove()
    fields[label] = clone.text().trim()
  })
  return fields
}

const SECTION_HEADINGS = [
  'Road Access',
  'Parking',
  'Take-off',
  'Landing',
  'Flying',
  'Hazards',
  'Other rules',
  'Site status',
  'Site owners',
  'Site XC Potential',
  'Site record',
]
// Headings that mark generic, non-site-specific boilerplate shared verbatim
// across every page (legal disclaimer, emergency-call instructions, image
// credits) — everything from here on is dropped.
const STOP_HEADINGS = ['Top Landing General', 'Mapping/Imagery', 'General notes', 'Who to call in an emergency in the UK:']

function linearLines(html: string): string[] {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<[^>]+>/g, '\n')
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/&pound;/g, '£')
  return text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function extractSections(lines: string[]): Record<string, string> {
  const sections: Record<string, string[]> = {}
  let current: string | null = null
  let stopped = false
  for (const line of lines) {
    if (stopped) break
    if (STOP_HEADINGS.includes(line)) {
      stopped = true
      break
    }
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

async function scrapeSite(url: string): Promise<ScrapedSite & { rawWindDirection: string | null; ambiguousWind: boolean }> {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)
  const name = $('h1').first().text().trim()
  const fields = extractTableFields($)

  const latLon = fields['Site Latitude'] && fields['Site Longitude'] ? parseLatLon(fields['Site Latitude'], fields['Site Longitude']) : null

  const rawWindDirection = fields['Wind Direction'] ?? null
  const bestDirection = fields['Best Direction'] ?? null
  // "All" (a few flat, multi-aspect training hills) means every direction works — no arc to fit, just the full circle.
  const isOmnidirectional = rawWindDirection?.trim().toLowerCase() === 'all'
  const windArc = isOmnidirectional ? { min: 0, max: 359 } : rawWindDirection ? parseWindDirection(rawWindDirection, bestDirection) : null
  const ambiguousWind = !!(rawWindDirection && !isOmnidirectional && extractCompassPoints(rawWindDirection).length === 2 && !bestDirection)

  const aslFt = parseFeet(fields['Height ASL Feet'])
  const topToBottomFt = parseFeet(fields['Height Top to Bottom Feet'])

  // A few source pages give two grid refs (one per takeoff) mashed into this field, or a
  // stray typo (e.g. "S0113009" — a mistyped O) — we already have exact lat/lon from the
  // table above, so just drop anything that isn't a single clean reference rather than
  // display something garbled.
  const gridRefRaw = fields['OS Grid Reference and Prefix'] ?? null
  const gridRefCandidate = gridRefRaw ? gridRefRaw.replace(/\s+/g, '').toUpperCase() : null
  const gridRef = gridRefCandidate && /^[A-Z]{2}\d{4,10}$/.test(gridRefCandidate) && gridRefCandidate.length % 2 === 0 ? gridRefCandidate : null

  const memberStatusRaw = (fields['Member status'] ?? '').toLowerCase()
  const membersOnly = memberStatusRaw.includes('members')

  const statusHeadings = $('table').first().find('thead h6')
  const statusLines = statusHeadings
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
  // Second+ status lines carry real access restrictions (e.g. seasonal lambing closures) beyond the plain open/members-only flag already captured above.
  const statusExtra = statusLines.slice(1).join(' ')

  const sections = extractSections(linearLines(html))

  const notesParts: string[] = []
  if (statusExtra) notesParts.push(`Access: ${statusExtra}`)
  if (aslFt != null || topToBottomFt != null) {
    const bits: string[] = []
    if (aslFt != null) bits.push(`Take-off ${aslFt} ft amsl`)
    if (topToBottomFt != null) bits.push(`${topToBottomFt} ft top-to-bottom`)
    notesParts.push(bits.join(', ') + '.')
  }
  if (bestDirection) notesParts.push(`Best direction: ${bestDirection}.`)
  if (sections['Road Access']) notesParts.push(`Directions: ${sections['Road Access']}`)
  if (sections['Parking']) notesParts.push(`Parking: ${sections['Parking']}`)
  if (sections['Take-off']) notesParts.push(`Take-off: ${sections['Take-off']}`)
  if (sections['Landing']) notesParts.push(`Landing: ${sections['Landing']}`)
  if (sections['Flying']) notesParts.push(`Flying: ${sections['Flying']}`)
  if (sections['Hazards']) notesParts.push(`Hazards: ${sections['Hazards']}`)
  if (sections['Other rules']) notesParts.push(`Rules: ${sections['Other rules']}`)
  if (sections['Site status']) notesParts.push(`Site status: ${sections['Site status']}`)
  if (sections['Site owners']) notesParts.push(`Site owners: ${sections['Site owners']}`)
  if (sections['Site XC Potential']) notesParts.push(`XC potential: ${sections['Site XC Potential']}`)
  if (sections['Site record']) notesParts.push(`Site record: ${sections['Site record']}`)
  if (rawWindDirection) notesParts.push(`Wind direction (site guide): ${rawWindDirection}${bestDirection ? ` — best: ${bestDirection}` : ''}.`)

  return {
    slug: slugify(name),
    name,
    grid_ref: gridRef,
    lat: latLon?.lat ?? null,
    lon: latLon?.lon ?? null,
    wind_dir_min: windArc?.min ?? null,
    wind_dir_max: windArc?.max ?? null,
    wind_speed_min_mph: null,
    wind_speed_max_mph: null,
    members_only: membersOnly,
    hg_rating: fields['Minimum BHPA Rating Hang Gliding'] ?? null,
    pg_rating: fields['Minimum BHPA Rating Paragliding'] ?? null,
    liaison: null,
    notes: notesParts.join('\n\n'),
    source_url: url,
    missing_wind_dir: !windArc,
    club: 'SEWHGPGC',
    rawWindDirection,
    ambiguousWind,
  }
}

async function main() {
  const links = await getSiteLinks()
  console.log(`Found ${links.length} site links`)

  const sites: (ScrapedSite & { rawWindDirection: string | null; ambiguousWind: boolean })[] = []
  for (const url of links) {
    try {
      const site = await scrapeSite(url)
      sites.push(site)
      console.log(`Scraped ${site.name}${site.missing_wind_dir ? '  [MISSING WIND DIR]' : ''}${site.lat == null ? '  [MISSING LAT/LON]' : ''}${site.ambiguousWind ? '  [AMBIGUOUS WIND ARC]' : ''}`)
    } catch (err) {
      console.error(`Failed to scrape ${url}:`, err)
    }
  }

  sites.sort((a, b) => a.name.localeCompare(b.name))
  mkdirSync('scripts/output', { recursive: true })
  writeFileSync('scripts/output/sewhgpgc.json', JSON.stringify(sites, null, 2))
  console.log(`\nWrote ${sites.length} sites to scripts/output/sewhgpgc.json`)

  const flagged = sites.filter((s) => s.missing_wind_dir || s.lat == null || s.ambiguousWind)
  if (flagged.length) {
    console.log(`\n⚠ ${flagged.length} site(s) need manual review:`)
    for (const s of flagged) console.log(`  - ${s.name}: wind="${s.rawWindDirection}" lat=${s.lat} ambiguous=${s.ambiguousWind}`)
  }
}

main()
