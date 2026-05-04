import type { Location } from "@/types/settings"

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface LogisticsInfo {
  nearest_branch: string
  distance_km: number
  drive_minutes: number
}

export async function computeLogistics(
  customerLat: number,
  customerLon: number,
  mainLocation: Location,
  branchLocations: Location[]
): Promise<LogisticsInfo | null> {
  const allLocations = [mainLocation, ...branchLocations].filter(
    (loc) => loc.lat != null && loc.lon != null
  ) as (Location & { lat: number; lon: number })[]

  if (allLocations.length === 0) return null

  const withDistance = allLocations.map((loc) => ({
    loc,
    km: haversineKm(loc.lat, loc.lon, customerLat, customerLon),
  }))
  const nearest = withDistance.reduce((a, b) => (a.km < b.km ? a : b))

  // OSRM — gratis, ingen API-nøgle, OpenStreetMap-data
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${nearest.loc.lon},${nearest.loc.lat};${customerLon},${customerLat}?overview=false`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (res.ok) {
      const data = await res.json()
      const route = data.routes?.[0]
      if (route) {
        return {
          nearest_branch: nearest.loc.name,
          distance_km: Math.round((route.distance / 1000) * 10) / 10,
          drive_minutes: Math.ceil(route.duration / 60),
        }
      }
    }
  } catch {
    // Falder igennem til estimat
  }

  // Fallback: luftlinje-afstand, estimeret køretid ved 50 km/t
  const km = Math.round(nearest.km * 10) / 10
  return {
    nearest_branch: nearest.loc.name,
    distance_km: km,
    drive_minutes: Math.ceil((km / 50) * 60),
  }
}
