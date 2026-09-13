import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { destinationPoint, distanceNm, bearingDeg } from '../lib/geo'
import { fetchElevations, type LatLon } from '../lib/elevation'
import { computeGlideCone, reachableExtents, type GlideConeResult } from '../lib/glideCone'

const TILE_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
const FALLBACK_CENTER: [number, number] = [53, -2.5]
const FALLBACK_ZOOM = 6
const NM_TO_FEET = 6076.12
const GRADIENT_MAX_METERS = 150
const GRADIENT_MAX_NM = GRADIENT_MAX_METERS / 1852

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}
const takeoffIcon = pinIcon('#0d9488')
const targetIcon = pinIcon('#4f46e5')
const gradientIcon = pinIcon('#c026d3')

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

/** Rough qualitative read on a launch slope's steepness — illustrative bands only; real launchability depends on wind, surface, and pilot skill too. */
function gradientAdvice(degrees: number): string {
  if (degrees >= 26.6) return 'Very steep (steeper than 1:2) — fine for an alpine/reverse launch in wind, but a still-air forward-launch run here would be tough.'
  if (degrees >= 18.4) return 'A solid, typical forward-launch gradient (around 1:2 to 1:3) — comfortable in light-to-moderate wind.'
  if (degrees >= 11.3) return "Shallow (around 1:3 to 1:5) — launchable, but you'll want decent wind to help the wing up; hard work in still air."
  return 'Very shallow (shallower than 1:5) — unlikely to work as a foot-launch without strong wind assistance; more a bowl lip than a launch face.'
}

type ClickMode = 'takeoff' | 'target' | 'gradient'

/**
 * Logged-in-only glide planning tool with three map interactions:
 *  - Takeoff: click to set a point, enter its facing direction (same
 *    convention as a site's wind window), and sweep a radial line-of-sight
 *    glide cone at a chosen ratio — walk outward along many bearings,
 *    tracking the steepest ratio needed so far to clear every closer sample
 *    on that bearing (same technique tools like hikeandfly.org use), so a
 *    prominence ahead of takeoff correctly shadows everything beyond it.
 *  - Target: click any other point for a direct distance/drop/required-
 *    ratio readout, independent of the cone.
 *  - Slope gradient: drag (start to end, capped at 150m) to measure the
 *    steepness of a specific launch face — e.g. the top and bottom of a
 *    take-off slope — and get a launchability read.
 */
export function SiteProfiler() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const takeoffMarkerRef = useRef<L.Marker | null>(null)
  const targetMarkerRef = useRef<L.Marker | null>(null)
  const conePolygonRef = useRef<L.Polygon | null>(null)
  const gradientLineRef = useRef<L.Polyline | null>(null)
  const gradientStartMarkerRef = useRef<L.Marker | null>(null)
  const gradientEndMarkerRef = useRef<L.Marker | null>(null)
  const clickModeRef = useRef<ClickMode>('takeoff')
  const draggingGradientRef = useRef(false)
  const gradientStartRef = useRef<LatLon | null>(null)

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

  const [gradientStart, setGradientStart] = useState<LatLon | null>(null)
  const [gradientEnd, setGradientEnd] = useState<LatLon | null>(null)
  const [gradientElevations, setGradientElevations] = useState<{ startFt: number; endFt: number } | null>(null)
  const [gradientLoading, setGradientLoading] = useState(false)

  useEffect(() => {
    clickModeRef.current = clickMode
    const map = mapRef.current
    if (!map) return
    if (clickMode === 'gradient') map.dragging.disable()
    else map.dragging.enable()
  }, [clickMode])

  // Map init — once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: FALLBACK_CENTER, zoom: FALLBACK_ZOOM, scrollWheelZoom: true })
    mapRef.current = map
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 17 }).addTo(map)

    const clampedEnd = (start: LatLon, raw: LatLon): LatLon => {
      const rawDistanceNm = distanceNm(start.lat, start.lon, raw.lat, raw.lon)
      if (rawDistanceNm <= GRADIENT_MAX_NM) return raw
      const bearing = bearingDeg(start.lat, start.lon, raw.lat, raw.lon)
      return destinationPoint(start.lat, start.lon, bearing, GRADIENT_MAX_NM)
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (clickModeRef.current === 'gradient') return
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

    map.on('mousedown', (e: L.LeafletMouseEvent) => {
      if (clickModeRef.current !== 'gradient') return
      const start = { lat: e.latlng.lat, lon: e.latlng.lng }
      gradientStartRef.current = start
      draggingGradientRef.current = true
      setGradientElevations(null)
      setGradientEnd(null)
      setGradientStart(start)
      gradientLineRef.current?.remove()
      gradientLineRef.current = L.polyline([[start.lat, start.lon], [start.lat, start.lon]], { color: '#c026d3', weight: 3 }).addTo(map)
    })

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (!draggingGradientRef.current || !gradientStartRef.current) return
      const end = clampedEnd(gradientStartRef.current, { lat: e.latlng.lat, lon: e.latlng.lng })
      gradientLineRef.current?.setLatLngs([
        [gradientStartRef.current.lat, gradientStartRef.current.lon],
        [end.lat, end.lon],
      ])
    })

    map.on('mouseup', (e: L.LeafletMouseEvent) => {
      if (!draggingGradientRef.current || !gradientStartRef.current) return
      draggingGradientRef.current = false
      const end = clampedEnd(gradientStartRef.current, { lat: e.latlng.lat, lon: e.latlng.lng })
      setGradientEnd(end)
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

  // Gradient end markers + elevation fetch for both points together.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    gradientStartMarkerRef.current?.remove()
    gradientStartMarkerRef.current = null
    gradientEndMarkerRef.current?.remove()
    gradientEndMarkerRef.current = null
    if (!gradientStart || !gradientEnd) return

    gradientStartMarkerRef.current = L.marker([gradientStart.lat, gradientStart.lon], { icon: gradientIcon }).addTo(map).bindTooltip('Start')
    gradientEndMarkerRef.current = L.marker([gradientEnd.lat, gradientEnd.lon], { icon: gradientIcon }).addTo(map).bindTooltip('End')

    setGradientLoading(true)
    fetchElevations([gradientStart, gradientEnd])
      .then(([startM, endM]) => setGradientElevations({ startFt: metersToFeet(startM), endFt: metersToFeet(endM) }))
      .catch(() => setGradientElevations(null))
      .finally(() => setGradientLoading(false))
  }, [gradientStart, gradientEnd])

  // Cone polygon — redraws whenever the computed sweep or the chosen ratio changes (cheap, no refetch on ratio change).
  const extents = cone ? reachableExtents(cone.rays, glideRatio) : null
  const maxReachNm = extents ? Math.max(0, ...extents.map((e) => e.distanceNm)) : null

  useEffect(() => {
    const map = mapRef.current
    conePolygonRef.current?.remove()
    conePolygonRef.current = null
    if (!map || !cone || !extents) return
    if (extents.every((e) => e.distanceNm === 0)) return // nothing to draw — the summary text below explains why

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const gradientDistanceM = gradientStart && gradientEnd ? distanceNm(gradientStart.lat, gradientStart.lon, gradientEnd.lat, gradientEnd.lon) * 1852 : null
  const gradientHeightDiffFt = gradientElevations ? gradientElevations.endFt - gradientElevations.startFt : null
  const gradientHeightDiffM = gradientHeightDiffFt != null ? gradientHeightDiffFt / 3.28084 : null
  const gradientDegrees =
    gradientDistanceM != null && gradientHeightDiffM != null && gradientDistanceM > 0
      ? (Math.atan(Math.abs(gradientHeightDiffM) / gradientDistanceM) * 180) / Math.PI
      : null
  const gradientRatioToOne =
    gradientDistanceM != null && gradientHeightDiffM != null && Math.abs(gradientHeightDiffM) > 0 ? gradientDistanceM / Math.abs(gradientHeightDiffM) : null

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Site Profiler</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Click the map to set a takeoff, then sweep a glide cone at a chosen ratio; click a second point to check whether a
          specific hill or landing spot is in reach; or drag a short line (max 150m) to measure a launch slope's gradient.
        </p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          Straight-line terrain clearance only, from SRTM elevation data — guidance, not a substitute for judging the day on the
          hill. Ignores wind, sink, and the fact that real pilots fly around obstacles rather than through them.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {clickMode === 'gradient' ? 'Drag the map to measure:' : 'Click the map to set:'}
        </span>
        {(['takeoff', 'target', 'gradient'] as ClickMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setClickMode(mode)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              clickMode === mode
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {mode === 'takeoff' ? 'Takeoff' : mode === 'target' ? 'Target' : 'Slope gradient'}
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
                  {maxReachNm === 0 ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      No reach at {glideRatio}:1 in any swept direction — the terrain right at this point drops away too slowly, or
                      rises, in every direction within the arc. Try a steeper takeoff spot (right at the edge/brow, not a bit back
                      from it), a wider or different facing direction, or a higher ratio.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Best reach at this ratio: {maxReachNm!.toFixed(2)} nm.</p>
                  )}
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Slope gradient</h3>
          {clickMode !== 'gradient' ? (
            <p className="text-sm text-slate-400">Click "Slope gradient" above, then drag on the map — e.g. from the top to the bottom of a launch face.</p>
          ) : !gradientStart ? (
            <p className="text-sm text-slate-400">Press and drag on the map (release within 150m of where you started).</p>
          ) : !gradientEnd ? (
            <p className="text-sm text-slate-400">Drag to the other point and release — capped at 150m from the start.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {gradientLoading
                  ? 'Fetching elevations…'
                  : gradientElevations
                    ? `Start: ${Math.round(gradientElevations.startFt)} ft · End: ${Math.round(gradientElevations.endFt)} ft`
                    : 'Elevation unavailable'}
              </p>
              {gradientDistanceM != null && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Distance: {Math.round(gradientDistanceM)} m</p>}
              {gradientHeightDiffFt != null && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Height difference: {Math.round(Math.abs(gradientHeightDiffFt))} ft ({gradientHeightDiffFt > 0 ? 'end is higher' : gradientHeightDiffFt < 0 ? 'end is lower' : 'level'})
                </p>
              )}

              {gradientDegrees != null && gradientRatioToOne != null && (
                <div className="mt-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Gradient: {gradientDegrees.toFixed(1)}° (about 1:{gradientRatioToOne.toFixed(1)})
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{gradientAdvice(gradientDegrees)}</p>
                </div>
              )}
              {gradientDistanceM != null && gradientDistanceM === 0 && (
                <p className="mt-3 text-xs text-slate-400">Start and end were the same point — drag further to measure a real slope.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
