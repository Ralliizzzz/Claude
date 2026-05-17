import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/app/admin/login/actions"
import { createServiceClient } from "@/lib/supabase/server"

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText"

export interface CvrCompany {
  cvrNumber: string
  companyName: string
  address: string
  city: string
  postalCode: string
  phone: string | null
  email: string | null
  alreadyImported: boolean
}

function extractCity(address: string): string {
  // "Firma ApS, Gade 1, 2100 København Ø, Denmark" → "København Ø"
  const parts = address.split(",").map((p) => p.trim())
  for (const part of parts) {
    const m = part.match(/^\d{4}\s+(.+)$/)
    if (m) return m[1]
  }
  return ""
}

function extractPostalCode(address: string): string {
  const m = address.match(/\b(\d{4})\b/)
  return m ? m[1] : ""
}

export async function POST(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })

  const { city, limit = 20 } = await req.json()

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API-nøgle mangler. Tilføj GOOGLE_PLACES_API_KEY i miljøvariablerne." },
      { status: 500 }
    )
  }

  const textQuery = city?.trim()
    ? `rengøringsfirma i ${city.trim()}`
    : "rengøringsfirma Danmark"

  let searchRes: Response
  try {
    searchRes = await fetch(PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri",
      },
      body: JSON.stringify({
        textQuery,
        languageCode: "da",
        maxResultCount: Math.min(Number(limit) || 20, 20),
      }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ error: "Kunne ikke forbinde til Google Places" }, { status: 502 })
  }

  if (!searchRes.ok) {
    const text = await searchRes.text().catch(() => "")
    return NextResponse.json({ error: `Google Places fejl ${searchRes.status}: ${text.slice(0, 200)}` }, { status: 502 })
  }

  const searchData = await searchRes.json()
  const places: any[] = searchData.places ?? []

  if (places.length === 0) {
    return NextResponse.json({ companies: [], total: 0 })
  }

  // Dedup check against existing prospects
  const supabase = await createServiceClient()
  const { data: existing } = await supabase.from("prospects").select("source").like("source", "places-%")
  const importedSet = new Set(
    (existing ?? []).map((p) => p.source?.replace("places-", "")).filter(Boolean)
  )

  const companies: CvrCompany[] = places.map((place) => {
    const placeId = place.id ?? ""
    const address = place.formattedAddress ?? ""
    return {
      cvrNumber: placeId,
      companyName: place.displayName?.text ?? "Ukendt",
      address,
      city: extractCity(address),
      postalCode: extractPostalCode(address),
      phone: place.nationalPhoneNumber ?? null,
      email: null,
      alreadyImported: importedSet.has(placeId),
    }
  })

  return NextResponse.json({ companies, total: companies.length })
}
