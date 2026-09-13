const EARTH_RADIUS_MILES = 3958.8
const EARTH_RADIUS_NM = 3440.065

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Great-circle distance between two lat/lon points, in miles. */
export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_MILES * c
}

/** Great-circle distance between two lat/lon points, in nautical miles — the glide-cone tool's native unit (aviation convention, and matches feet for a unit-consistent glide-ratio calc via NM_TO_FEET). */
export function distanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_NM * c
}

/** Bearing from point 1 to point 2, degrees 0-360 (0 = north, clockwise). */
export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** The point reached by travelling `distanceNm` nautical miles from (lat, lon) along `bearing` (0-360, clockwise from north) — the forward geodesic problem, spherical-earth approximation (same simplification as distanceMiles/distanceNm). */
export function destinationPoint(lat: number, lon: number, bearing: number, distanceNmVal: number): { lat: number; lon: number } {
  const δ = distanceNmVal / EARTH_RADIUS_NM
  const θ = toRad(bearing)
  const φ1 = toRad(lat)
  const λ1 = toRad(lon)

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))

  return { lat: toDeg(φ2), lon: ((toDeg(λ2) + 540) % 360) - 180 }
}
