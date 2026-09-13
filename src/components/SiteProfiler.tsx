import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { destinationPoint, distanceNm } from '../lib/geo'
import { fetchElevations, type LatLon } from '../lib/elevation'
import { computeGlideCone, reachableExtents, type GlideConeResult } from '../lib/glideCone'

const TILE_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
const FALLBACK_CENTER: [number, number] = [53, -2.5]
const FALLBACK_ZOOM = 6
const NM_TO_FEET = 6076.12

const takeoffIcon = L.divIcon({
  className: '',
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#0d9488;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})
const targetIcon = L.divIcon({
  className: '',
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#4f46e5;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function metersToFeet(m: number): number {
  return m * 3.28084
}

/** Rough qualitative read on a required glide ratio — illustrative bands only, not a substitute for real judgement on the day (wind, sink, wing performance all shift this). */
function ratioAdvice(ratio: number): string {
  if (ratio <= 6) return 'Comfortably within reach for most wings, even in still air.'
  if (ratio <= 9) return 'Achievable for a modern paraglider in still air — give yourself margin for any headwind or sink.'
  if (ratio <= 13) return 'Marginal — only realistic in a tailwind or with real lift along the way, or for a hang glider.'
  return "Requires hang-glider-level performance or exceptional conditions — don't rely on this in still air."
}

type ClickMode = 'takeoff' | 'target'

/**
 * Logged-in-only glide planning tool. Click the map to set a takeoff, enter
 * its facing direction (the wind window / which way the slope opens), and
 * sweep a radial line-of-sight glide cone at a chosen ratio — the same
 * technique tools like hikeandfly.org use: walk outward along many bearings
 * and track the steepest ratio needed so far, so a prominence ahead of
 * takeoff correctly shadows everything beyond it on that bearing. A second
 * click (target mode) picks any other point and gets the same distance/
 * drop/required-ratio numbers directly, independent of the cone.
 */
export function SiteProfiler() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const takeoffMarkerRef = useRef<L.Marker | null>(null)
  const targetMarkerRef = useRef<L.Marker | null>(null)
  const conePolygonRef = useRef<L.Polygon | null>(null)
  const clickModeRef = useRef<ClickMode>('takeoff')

  const [clickMode, setClickMode] = useState<ClickMode>('takeoff')
  const [takeoff, setTakeoff] = useState<LatLon | null>(null)
  const [takeoffElevationFt, setTakeoffElevationFt] = useState<number | null>(null)
  const [takeoffLoading, setTakeoffLoading] = useState(false)

  const [target, setTarget] = useState<LatLon | null>(null)
  const [targetElevationFt, setTargetElevationFt] = useState<number | null>(null)
  const [targetLoading, setTargetLoading] = useState(false)

  const [dirMin, setDirMin] = useState('')
  const [dirMax, setDirMax] = useState('')
  const [glideRatio, setGlideRatio] = useState(8)

  const [cone, setCone] = useState<GlideConeResult | null>(null)
  const [coneLoading, setConeLoading] = useState(false)
  const [coneError, setConeError] = useState('')

  useEffect(() => {
    clickModeRef.current = clickMode
  }, [clickMode])

  // Map init — once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM, scrollWheelZoom: true })
    mapRef.current = map
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 17 }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const point = { lat: e.latlng.lat, lon: e.latlng.lng }
      if (clickModeRef.current === 'takeoff') {
        setTakeoff(point)
        setTakeoffElevationFt(null)
        setCone(null)
        setConeError('')
      } else {
        setTarget(point)
        setTargetElevationFt(null)
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Takeoff marker + elevation fetch.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    takeoffMarkerRef.current?.remove()
    takeoffMarkerRef.current = null
    if (!takeoff) return

    takeoffMarkerRef.current = L.marker([takeoff.lat, takeoff.lon], { icon: takeoffIcon }).addTo(map).bindTooltip('Takeoff')
    setTakeoffLoading(true)
    fetchElevations([takeoff])
      .then(([m]) => setTakeoffElevationFt(metersToFeet(m)))
      .catch(() => setTakeoffElevationFt(null))
      .finally(() => setTakeoffLoading(false))
  }, [takeoff])

  // Target marker + elevation fetch.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    targetMarkerRef.current?.remove()
    targetMarkerRef.current = null
    if (!target) return

    targetMarkerRef.current = L.marker([target.lat, target.lon], { icon: targetIcon }).addTo(map).bindTooltip('Target')
    setTargetLoading(true)
    fetchElevations([target])
      .then(([m]) => setTargetElevationFt(metersToFeet(m)))
      .catch(() => setTargetElevationFt(null))
      .finally(() => setTargetLoading(false))
  }, [target])

  // Cone polygon — redraws whenever the computed sweep or the chosen ratio changes (cheap, no refetch on ratio change).
  useEffect(() => {
    const map = mapRef.current
    conePolygonRef.current?.remove()
    conePolygonRef.current = null
    if (!map || !cone) return

    const extents = reachableExtents(cone.rays, glideRatio)
    const boundary: [number, number][] = [
      [cone.takeoff.lat, cone.takeoff.lon],
      ...extents.map((e) => {
        const p = destinationPoint(cone.takeoff.lat, cone.takeoff.lon, e.bearingDeg, e.distanceNm)
        return [p.lat, p.lon] as [number, number]
      }),
      [cone.takeoff.lat, cone.takeoff.lon],
    ]
    conePolygonRef.current = L.polygon(boundary, {
      color: '#0ca30c',
      weight: 2,
      fillColor: '#0ca30c',
      fillOpacity: 0.25,
    }).addTo(map)
  }, [cone, glideRatio])

  const dirMinNum = parseInt(dirMin, 10)
  const dirMaxNum = parseInt(dirMax, 10)
  const hasValidWindow = !isNaN(dirMinNum) && !isNaN(dirMaxNum) && dirMinNum >= 0 && dirMinNum <= 359 && dirMaxNum >= 0 && dirMaxNum <= 359

  const runSweep = async () => {
    if (!takeoff || !hasValidWindow) return
    setConeLoading(true)
    setConeError('')
    setCone(null)
    try {
      const span = ((dirMaxNum - dirMinNum + 360) % 360) || 360
      const centerBearingDeg = (dirMinNum + span / 2) % 360
      const result = await computeGlideCone({ takeoff, centerBearingDeg })
      setCone(result)
    } catch (err) {
      setConeError(err instanceof Error ? err.message : 'Failed to compute the glide cone.')
    } finally {
      setConeLoading(false)
    }
  }

  const targetDistanceNm = takeoff && target ? distanceNm(takeoff.lat, takeoff.lon, target.lat, target.lon) : null
  const targetDropFt = takeoffElevationFt != null && targetElevationFt != null ? takeoffElevationFt - targetElevationFt : null
  const targetRequiredRatio = targetDistanceNm != null && targetDropFt != null && targetDropFt > 0 ? (targetDistanceNm * NM_TO_FEET) / targetDropFt : null

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Site Profiler</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Click the map to set a takeoff, then sweep a glide cone at a chosen ratio — or click a second point to check whether a
          specific hill or landing spot is in reach. Distances in nautical miles, heights in feet.
        </p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          Straight-line terrain clearance only, from SRTM elevation data — guidance, not a substitute for judging the day on the
          hill. Ignores wind, sink, and the fact that real pilots fly around obstacles rather than through them.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Click the map to set:</span>
        {(['takeoff', 'target'] as ClickMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setClickMode(mode)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              clickMode === mode
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {mode === 'takeoff' ? 'Takeoff' : 'Target'}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="h-[420px] w-full rounded-xl sm:h-[520px]" />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Takeoff &amp; glide cone</h3>
          {!takeoff ? (
            <p className="text-sm text-slate-400">Click "Takeoff" above, then click the map.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Elevation: {takeoffLoading ? 'loading…' : takeoffElevationFt != null ? `${Math.round(takeoffElevationFt)} ft` : 'unavailable'}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Facing dir. min
                  <input
                    type="number"
                    min={0}
                    max={359}
                    value={dirMin}
                    onChange={(e) => setDirMin(e.target.value)}
                    placeholder="e.g. 250"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Facing dir. max
                  <input
                    type="number"
                    min={0}
                    max={359}
                    value={dirMax}
                    onChange={(e) => setDirMax(e.target.value)}
                    placeholder="e.g. 340"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </label>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">The direction the slope opens toward — same convention as a site's wind window.</p>

              <button
                onClick={runSweep}
                disabled={!hasValidWindow || coneLoading}
                className="mt-3 cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {coneLoading ? 'Sweeping…' : 'Show glide cone'}
              </button>
              {coneError && <p className="mt-2 text-xs text-[#d03b3b]">{coneError}</p>}

              {cone && (
                <div className="mt-4">
                  <label className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Glide ratio</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{glideRatio}:1</span>
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={20}
                    step={0.5}
                    value={glideRatio}
                    onChange={(e) => setGlideRatio(parseFloat(e.target.value))}
                    className="mt-1 w-full"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Target check</h3>
          {!takeoff ? (
            <p className="text-sm text-slate-400">Set a takeoff first.</p>
          ) : !target ? (
            <p className="text-sm text-slate-400">Click "Target" above, then click a hill or landing spot on the map.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Elevation: {targetLoading ? 'loading…' : targetElevationFt != null ? `${Math.round(targetElevationFt)} ft` : 'unavailable'}
              </p>
              {targetDistanceNm != null && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Distance: {targetDistanceNm.toFixed(2)} nm</p>
              )}
              {targetDropFt != null && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Height drop: {Math.round(targetDropFt)} ft{targetDropFt <= 0 ? ' (target is higher than takeoff)' : ''}
                </p>
              )}

              {targetRequiredRatio != null ? (
                <div className="mt-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Required glide ratio: {targetRequiredRatio.toFixed(1)}:1</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ratioAdvice(targetRequiredRatio)}</p>
                </div>
              ) : targetDropFt != null && targetDropFt <= 0 ? (
                <p className="mt-3 rounded-lg bg-[#d03b3b]/10 p-3 text-sm text-[#d03b3b]">
                  Not reachable by unpowered glide — the target sits at or above takeoff height.
                </p>
              ) : null}

              <p className="mt-3 text-[11px] text-slate-400">
                Straight-line only — doesn't check for intervening high ground the way the glide cone does.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
