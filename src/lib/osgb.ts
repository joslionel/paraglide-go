// Convert an Ordnance Survey National Grid reference (OSGB36) to WGS84 lat/lon.
// Implements the standard OS "Guide to coordinate systems in Great Britain" algorithm:
// grid ref -> easting/northing -> OSGB36 lat/lon (Airy 1830) -> Helmert transform -> WGS84 lat/lon.

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

function gridRefToEastingNorthing(gridref: string): { e: number; n: number } | null {
  const cleaned = gridref.replace(/\s+/g, '').toUpperCase()
  const match = cleaned.match(/^([A-Z]{2})(\d+)$/)
  if (!match) return null
  const [, letters, digits] = match
  if (digits.length % 2 !== 0) return null

  let l1 = letters.charCodeAt(0) - 65
  let l2 = letters.charCodeAt(1) - 65
  if (l1 > 7) l1--
  if (l2 > 7) l2--

  const e100km = ((l1 - 2) % 5) * 5 + (l2 % 5)
  const n100km = 19 - Math.floor(l1 / 5) * 5 - Math.floor(l2 / 5)
  if (e100km < 0 || e100km > 6 || n100km < 0 || n100km > 12) return null

  const half = digits.length / 2
  const digitScale = Math.pow(10, 5 - half)
  const e = e100km * 100000 + parseInt(digits.slice(0, half), 10) * digitScale
  const n = n100km * 100000 + parseInt(digits.slice(half), 10) * digitScale
  return { e, n }
}

function eastingNorthingToOsgb36LatLon(E: number, N: number): { lat: number; lon: number } {
  const a = 6377563.396
  const b = 6356256.909
  const F0 = 0.9996012717
  const lat0 = 49 * DEG2RAD
  const lon0 = -2 * DEG2RAD
  const N0 = -100000
  const E0 = 400000
  const e2 = 1 - (b * b) / (a * a)
  const n = (a - b) / (a + b)
  const n2 = n * n
  const n3 = n * n * n

  let lat = lat0
  let M = 0
  do {
    lat = (N - N0 - M) / (a * F0) + lat
    const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (lat - lat0)
    const Mb = (3 * n + 3 * n2 + (21 / 8) * n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0)
    const Mc = ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0))
    const Md = (35 / 24) * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0))
    M = b * F0 * (Ma - Mb + Mc - Md)
  } while (N - N0 - M >= 0.00001)

  const sinLat = Math.sin(lat)
  const nu = (a * F0) / Math.sqrt(1 - e2 * sinLat * sinLat)
  const rho = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5)
  const eta2 = nu / rho - 1

  const tanLat = Math.tan(lat)
  const secLat = 1 / Math.cos(lat)
  const tan2 = tanLat * tanLat
  const tan4 = tan2 * tan2
  const tan6 = tan4 * tan2

  const VII = tanLat / (2 * rho * nu)
  const VIII = (tanLat / (24 * rho * Math.pow(nu, 3))) * (5 + 3 * tan2 + eta2 - 9 * tan2 * eta2)
  const IX = (tanLat / (720 * rho * Math.pow(nu, 5))) * (61 + 90 * tan2 + 45 * tan4)

  const X = secLat / nu
  const XI = (secLat / (6 * Math.pow(nu, 3))) * (nu / rho + 2 * tan2)
  const XII = (secLat / (120 * Math.pow(nu, 5))) * (5 + 28 * tan2 + 24 * tan4)
  const XIIA = (secLat / (5040 * Math.pow(nu, 7))) * (61 + 662 * tan2 + 1320 * tan4 + 720 * tan6)

  const dE = E - E0
  const finalLat = lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6
  const finalLon = lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7

  return { lat: finalLat * RAD2DEG, lon: finalLon * RAD2DEG }
}

// Helmert transform parameters, OSGB36 -> WGS84 (OS published approximate values)
const HELMERT = {
  tx: 446.448,
  ty: -125.157,
  tz: 542.06,
  s: -20.4894 / 1e6,
  rx: (0.1502 / 3600) * DEG2RAD,
  ry: (0.247 / 3600) * DEG2RAD,
  rz: (0.8421 / 3600) * DEG2RAD,
}

function latLonToCartesian(lat: number, lon: number, a: number, b: number) {
  const latR = lat * DEG2RAD
  const lonR = lon * DEG2RAD
  const e2 = 1 - (b * b) / (a * a)
  const sinLat = Math.sin(latR)
  const cosLat = Math.cos(latR)
  const nu = a / Math.sqrt(1 - e2 * sinLat * sinLat)
  const x = nu * cosLat * Math.cos(lonR)
  const y = nu * cosLat * Math.sin(lonR)
  const z = nu * (1 - e2) * sinLat
  return { x, y, z }
}

function cartesianToLatLon(x: number, y: number, z: number, a: number, b: number) {
  const e2 = 1 - (b * b) / (a * a)
  const p = Math.sqrt(x * x + y * y)
  let lat = Math.atan2(z, p * (1 - e2))
  for (let i = 0; i < 10; i++) {
    const sinLat = Math.sin(lat)
    const nu = a / Math.sqrt(1 - e2 * sinLat * sinLat)
    lat = Math.atan2(z + e2 * nu * sinLat, p)
  }
  const lon = Math.atan2(y, x)
  return { lat: lat * RAD2DEG, lon: lon * RAD2DEG }
}

export function osgb36GridRefToWgs84(gridref: string): { lat: number; lon: number } | null {
  const en = gridRefToEastingNorthing(gridref)
  if (!en) return null
  const osgb36 = eastingNorthingToOsgb36LatLon(en.e, en.n)

  const airy = { a: 6377563.396, b: 6356256.909 }
  const wgs84Ellipsoid = { a: 6378137, b: 6356752.3142 }

  const cart = latLonToCartesian(osgb36.lat, osgb36.lon, airy.a, airy.b)
  const { tx, ty, tz, s, rx, ry, rz } = HELMERT
  const x2 = tx + cart.x * (1 + s) - cart.y * rz + cart.z * ry
  const y2 = ty + cart.x * rz + cart.y * (1 + s) - cart.z * rx
  const z2 = tz - cart.x * ry + cart.y * rx + cart.z * (1 + s)

  const wgs84 = cartesianToLatLon(x2, y2, z2, wgs84Ellipsoid.a, wgs84Ellipsoid.b)
  return { lat: Math.round(wgs84.lat * 1e6) / 1e6, lon: Math.round(wgs84.lon * 1e6) / 1e6 }
}
