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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (apiKey) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json")
      url.searchParams.set("origins", `${nearest.loc.lat},${nearest.loc.lon}`)
      url.searchParams.set("destinations", `${customerLat},${customerLon}`)
      url.searchParams.set("mode", "driving")
      url.searchParams.set("language", "da")
      url.searchParams.set("key", apiKey)

      const res = await fetch(url.toString(), { next: { revalidate: 0 } })
      if (res.ok) {
        const data = await res.json()
        const element = data.rows?.[0]?.elements?.[0]
        if (element?.status === "OK") {
          return {
            nearest_branch: nearest.loc.name,
            distance_km: Math.round((element.distance.value / 1000) * 10) / 10,
            drive_minutes: Math.ceil(element.duration.value / 60),
          }
        }
      }
    } catch {
      // Falder igennem til estimat
    }
  }

  // Fallback: luftlinje-afstand, estimeret køretid ved 50 km/t
  const km = Math.round(nearest.km * 10) / 10
  return {
    nearest_branch: nearest.loc.name,
    distance_km: km,
    drive_minutes: Math.ceil((km / 50) * 60),
  }
}
