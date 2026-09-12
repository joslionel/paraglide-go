import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Site, ConditionsCache } from '../lib/types'
import type { Status } from '../lib/scoring'

// Same tile source as SiteMap.tsx (OpenTopoMap — no API key needed).
const TILE_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'

// Rough UK center — just the initial view before the first fitBounds call;
// Leaflet needs some view set before it will render anything.
const FALLBACK_CENTER: [number, number] = [53, -2.5]
const FALLBACK_ZOOM = 6

// Mirrors StatusPill.tsx's fixed status hues — duplicated as raw hex here
// because Leaflet's divIcon takes an inline style string, not a Tailwind
// class (same reason SiteMap.tsx hardcodes its own pin color).
const STATUS_COLOR: Record<Status, string> = {
  on: '#0ca30c',
  marginal: '#fab219',
  off: '#d03b3b',
  unknown: '#8b8d98',
}

function makeIcon(color: string, selected: boolean) {
  const size = selected ? 20 : 14
  const ring = selected ? ',0 0 0 4px rgba(15,23,42,0.35)' : ''
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/**
 * One marker per site, colored by current status. Clicking a marker selects
 * it (parent shows that site's forecast + nearby sites below the map).
 *
 * Marker creation/removal and the initial fitBounds only run when the set of
 * visible sites changes (filter switch) — recoloring markers for a status
 * update or a new selection is a separate effect that never touches the
 * viewport, so clicking a pin doesn't yank the map back to a fitted view.
 */
export function AllSitesMap({
  sites,
  conditions,
  selectedSlug,
  onSelect,
}: {
  sites: Site[]
  conditions: ConditionsCache | null
  selectedSlug: string | null
  onSelect: (slug: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      scrollWheelZoom: true,
      attributionControl: true,
    })
    mapRef.current = map
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 17 }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const siteKey = sites
    .map((s) => s.slug)
    .sort()
    .join(',')

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    const withCoords = sites.filter((s): s is Site & { lat: number; lon: number } => s.lat != null && s.lon != null)
    withCoords.forEach((site) => {
      const marker = L.marker([site.lat, site.lon], { icon: makeIcon(STATUS_COLOR.unknown, false) })
        .addTo(map)
        .bindTooltip(site.name)
      marker.on('click', () => onSelectRef.current(site.slug))
      markersRef.current.set(site.slug, marker)
    })

    if (withCoords.length > 0) {
      map.fitBounds(
        L.latLngBounds(withCoords.map((s) => [s.lat, s.lon] as [number, number])),
        { padding: [30, 30], maxZoom: 12 },
      )
    }
    // Only rebuild markers + refit the viewport when the visible site SET
    // changes, not on every status/selection update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  useEffect(() => {
    const map = mapRef.current
    sites.forEach((site) => {
      const marker = markersRef.current.get(site.slug)
      if (!marker) return
      const status = conditions?.sites[site.slug]?.now?.status ?? 'unknown'
      const isSelected = site.slug === selectedSlug
      marker.setIcon(makeIcon(STATUS_COLOR[status], isSelected))
      if (isSelected && map) map.panTo(marker.getLatLng())
    })
  }, [sites, conditions, selectedSlug])

  return <div ref={containerRef} className="h-[420px] w-full rounded-xl sm:h-[520px]" />
}
