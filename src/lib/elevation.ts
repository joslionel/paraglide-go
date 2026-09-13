// Open-Meteo's Elevation API — free, keyless, same provider as the rest of
// the app's weather data. Returns meters ASL for a batch of lat/lon points,
// in the same order they were requested.
export interface LatLon {
  lat: number
  lon: number
}

const CHUNK_SIZE = 100 // keeps each request's query string a reasonable length
const MAX_CONCURRENT = 2 // Open-Meteo's free elevation endpoint 429s on bursts of many parallel requests
const MAX_RETRIES = 3

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchElevationChunk(chunk: LatLon[]): Promise<number[]> {
  const url = new URL('https://api.open-meteo.com/v1/elevation')
  url.searchParams.set('latitude', chunk.map((p) => p.lat.toFixed(6)).join(','))
  url.searchParams.set('longitude', chunk.map((p) => p.lon.toFixed(6)).join(','))

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url.toString())
    if (res.ok) {
      const data = await res.json()
      return data.elevation as number[]
    }
    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(500 * 2 ** attempt) // 500ms, 1s, 2s
      continue
    }
    throw new Error(`Elevation request failed (${res.status})`)
  }
}

/** Elevations in meters ASL, one per input point, same order. Chunked and rate-limited (a full sweep can be 500+ points) — Open-Meteo's free elevation endpoint 429s on bursts of many simultaneous requests. */
export async function fetchElevations(points: LatLon[]): Promise<number[]> {
  if (points.length === 0) return []

  const chunks: LatLon[][] = []
  for (let i = 0; i < points.length; i += CHUNK_SIZE) chunks.push(points.slice(i, i + CHUNK_SIZE))

  const results: number[][] = new Array(chunks.length)
  let nextChunkIndex = 0
  async function worker() {
    while (nextChunkIndex < chunks.length) {
      const i = nextChunkIndex++
      results[i] = await fetchElevationChunk(chunks[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, chunks.length) }, worker))

  return results.flat()
}
