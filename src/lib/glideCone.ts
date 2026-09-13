// Radial line-of-sight glide-reachability sweep — the same technique tools
// like hikeandfly.org use: walk outward from a takeoff point along many
// bearings, and at each sampled distance track the STEEPEST glide ratio
// required so far to have cleared every closer sample on that bearing. That
// running max is monotonically non-decreasing with distance, so "is this
// point reachable at ratio R" is just "is the running-max required ratio at
// this point <= R" — a prominence between takeoff and a farther point
// correctly makes that farther point (and everything beyond it on the same
// bearing) unreachable, without needing a full 2D flood-fill.
//
// Distances are nautical miles and elevations feet throughout (aviation/
// gliding convention, and what makes a plain distance/drop division give a
// dimensionless ratio) — converted from Open-Meteo's meters at the one spot
// they enter this module.
import { destinationPoint } from './geo'
import { fetchElevations, type LatLon } from './elevation'

const METERS_TO_FEET = 3.28084
const NM_TO_FEET = 6076.12

export interface GlideSample {
  distanceNm: number
  /** Running-max ratio needed to clear every sample up to and including this one — Infinity if terrain here or closer is at/above takeoff height. */
  requiredRatio: number
}

export interface GlideRay {
  bearingDeg: number
  samples: GlideSample[]
}

export interface GlideConeResult {
  takeoff: LatLon
  takeoffElevationFt: number
  rays: GlideRay[]
}

export interface GlideConeParams {
  takeoff: LatLon
  /** Center of the swept arc, degrees — typically the takeoff's facing direction (away from the slope), not the wind window itself. */
  centerBearingDeg: number
  /** Half-width of the swept arc either side of centerBearingDeg. Defaults to 90 (a full forward hemisphere) since glide direction isn't limited to the launch wind window. */
  arcHalfWidthDeg?: number
  bearingStepDeg?: number
  maxDistanceNm?: number
  distanceSteps?: number
}

export async function computeGlideCone({
  takeoff,
  centerBearingDeg,
  arcHalfWidthDeg = 90,
  bearingStepDeg = 10,
  maxDistanceNm = 12,
  distanceSteps = 15,
}: GlideConeParams): Promise<GlideConeResult> {
  const bearings: number[] = []
  for (let offset = -arcHalfWidthDeg; offset <= arcHalfWidthDeg; offset += bearingStepDeg) {
    bearings.push(((centerBearingDeg + offset) % 360 + 360) % 360)
  }

  const stepDistanceNm = maxDistanceNm / distanceSteps

  // One flat point list (takeoff + every sample on every bearing) so the
  // whole sweep is a single batched elevation fetch instead of one per ray.
  const points: LatLon[] = [takeoff]
  const sampleIndices: number[][] = bearings.map(() => [])
  bearings.forEach((bearing, bIdx) => {
    for (let step = 1; step <= distanceSteps; step++) {
      sampleIndices[bIdx].push(points.length)
      points.push(destinationPoint(takeoff.lat, takeoff.lon, bearing, step * stepDistanceNm))
    }
  })

  const elevationsM = await fetchElevations(points)
  const takeoffElevationFt = elevationsM[0] * METERS_TO_FEET

  const rays: GlideRay[] = bearings.map((bearing, bIdx) => {
    let runningMax = 0
    const samples: GlideSample[] = sampleIndices[bIdx].map((pointIdx, stepIdx) => {
      const distanceNmVal = (stepIdx + 1) * stepDistanceNm
      const elevationFt = elevationsM[pointIdx] * METERS_TO_FEET
      const dropFt = takeoffElevationFt - elevationFt
      const requiredHere = dropFt <= 0 ? Infinity : (distanceNmVal * NM_TO_FEET) / dropFt
      runningMax = Math.max(runningMax, requiredHere)
      return { distanceNm: distanceNmVal, requiredRatio: runningMax }
    })
    return { bearingDeg: bearing, samples }
  })

  return { takeoff, takeoffElevationFt, rays }
}

/** For a chosen glide ratio, the farthest reachable distance on each bearing (0 if even the closest sample needs a steeper ratio than chosen). Cheap — no refetch — so a ratio slider can call this on every change. */
export function reachableExtents(rays: GlideRay[], ratio: number): { bearingDeg: number; distanceNm: number }[] {
  return rays.map((ray) => {
    let extent = 0
    for (const sample of ray.samples) {
      if (sample.requiredRatio > ratio) break // running max is monotonic — nothing farther on this ray is reachable either
      extent = sample.distanceNm
    }
    return { bearingDeg: ray.bearingDeg, distanceNm: extent }
  })
}
