import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// OpenTopoMap instead of Thunderforest's OpenCycleMap — same idea (OSM data
// with contour lines/elevation shading) but no API key/signup required.
// Swap the tile URL below if you'd rather use real OpenCycleMap once you
// have a Thunderforest key.
const TILE_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'

const DEFAULT_ZOOM = 14 // roughly a 2km-wide view at UK latitudes

// Plain colored-dot pin (matches the app's existing hand-rolled SVG
// iconography) instead of Leaflet's default marker images, which need
// asset-path config to bundle correctly under Vite.
const pinIcon = L.divIcon({
  className: '',
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#d03b3b;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export function SiteMap({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
      attributionControl: true,
    })
    mapRef.current = map

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 17 }).addTo(map)
    L.marker([lat, lon], { icon: pinIcon }).addTo(map).bindTooltip(name)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lon, name])

  return <div ref={containerRef} className="h-56 w-full rounded-lg" />
}
