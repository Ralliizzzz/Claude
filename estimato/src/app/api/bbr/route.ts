import { NextResponse } from "next/server"

// DAWA: Danmarks Adresser Web API (gratis, ingen auth)
const DAWA_BASE = "https://api.dataforsyningen.dk"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q) {
    return NextResponse.json({ error: "Mangler q parameter" }, { status: 400 })
  }

  const mode = searchParams.get("mode") ?? "autocomplete"

  if (mode === "autocomplete") {
    // Adresse-autocomplete
    const res = await fetch(
      `${DAWA_BASE}/adresser/autocomplete?q=${encodeURIComponent(q)}&per_side=6&fuzzy=true`,
      { next: { revalidate: 0 } }
    )
    const data = await res.json()
    const suggestions = data.map((item: { tekst: string; adresse: { id: string } }) => ({
      text: item.tekst,
      id: item.adresse.id,
    }))
    return NextResponse.json(suggestions)
  }

  if (mode === "lookup") {
    // Hent adressedata inkl. BBR-information
    const addressId = searchParams.get("id")
    if (!addressId) {
      return NextResponse.json({ error: "Mangler id" }, { status: 400 })
    }

    const res = await fetch(`${DAWA_BASE}/adresser/${addressId}`, {
      next: { revalidate: 0 },
    })
    const addr = await res.json()

    // Hent BBR-enheder via adgangsadresse
    const adgangId = addr.adgangsadresseid
    let sqm: number | null = null
    let propertyType: string | null = null

    if (adgangId) {
      try {
        const bbrRes = await fetch(
          `${DAWA_BASE}/bbrlight/enheder?adgangspunkt=${adgangId}`,
          { next: { revalidate: 0 } }
        )
        if (bbrRes.ok) {
          const bbrData = await bbrRes.json()
          const enhed = bbrData[0]
          if (enhed) {
            sqm = enhed.ENH_AREALTILBOLIG ?? enhed.ENH_BOLIGAREAL ?? null
            const bygType = enhed.BYG_ANVEND_KODE
            if (bygType === "120") propertyType = "house"
            else if (bygType === "130" || bygType === "140") propertyType = "apartment"
            else if (bygType) propertyType = "commercial"
          }
        }
      } catch {
        // BBR-lookup fejlede — returner uden m²
      }
    }

    return NextResponse.json({
      address: addr.adressebetegnelse,
      sqm,
      propertyType,
    })
  }

  return NextResponse.json({ error: "Ukendt mode" }, { status: 400 })
}
