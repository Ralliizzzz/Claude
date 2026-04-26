import { NextResponse } from "next/server"

// DAWA: Danmarks Adresser Web API (gratis, ingen auth)
const DAWA_BASE = "https://api.dataforsyningen.dk"
// Datafordeler BBR API
const BBR_BASE = "https://services.datafordeler.dk/BBR/BBRPublic/1/REST"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("mode") ?? "autocomplete"

  if (mode === "autocomplete") {
    const q = searchParams.get("q")
    if (!q) {
      return NextResponse.json({ error: "Mangler q parameter" }, { status: 400 })
    }
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
    const addressId = searchParams.get("id")
    if (!addressId) {
      return NextResponse.json({ error: "Mangler id" }, { status: 400 })
    }

    // Hent adressebetegnelse fra DAWA
    const addrRes = await fetch(`${DAWA_BASE}/adresser/${addressId}`, {
      next: { revalidate: 0 },
    })
    const addr = await addrRes.json()

    let sqm: number | null = null
    let propertyType: string | null = null
    let rooms: number | null = null
    let toilets: number | null = null
    let bathrooms: number | null = null
    let floors: number | null = null

    const username = process.env.DATAFORDELER_USERNAME
    const password = process.env.DATAFORDELER_PASSWORD

    if (username && password) {
      try {
        const bbrRes = await fetch(
          `${BBR_BASE}/enhed?AdresseIdentificerer=${addressId}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&format=JSON`,
          { next: { revalidate: 0 } }
        )
        if (bbrRes.ok) {
          const bbrData = await bbrRes.json()
          const enhed = Array.isArray(bbrData) ? bbrData[0] : null
          if (enhed) {
            sqm = enhed.enh027ArealTilBeboelse ?? enhed.enh026EnhedensSamledeAreal ?? null
            rooms = enhed.enh021AntalVærelser ?? null
            toilets = enhed.enh023AntalVandskylledeToiletter ?? null
            bathrooms = enhed.enh024AntalBadeværelser ?? null

            const anvend: string | undefined = enhed.enh020EnhedensAnvendelse
            if (anvend) {
              const kode = String(anvend)
              if (["110", "120", "130", "185"].includes(kode)) propertyType = "house"
              else if (["140", "150", "160"].includes(kode)) propertyType = "apartment"
              else propertyType = "commercial"
            }

            // Hent antal etager fra bygning
            const bygningId: string | undefined = enhed.enh016BygningElEjl
            if (bygningId) {
              try {
                const bygRes = await fetch(
                  `${BBR_BASE}/bygning?id=${bygningId}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&format=JSON`,
                  { next: { revalidate: 0 } }
                )
                if (bygRes.ok) {
                  const bygData = await bygRes.json()
                  const byg = Array.isArray(bygData) ? bygData[0] : null
                  if (byg) floors = byg.byg054AntalEtager ?? null
                }
              } catch { /* ignorér */ }
            }
          }
        }
      } catch {
        // BBR-lookup fejlede — returner uden m²
      }
    }

    const coords: number[] | undefined = addr?.adgangsadresse?.adgangspunkt?.koordinater
    const lon: number | null = coords?.[0] ?? null
    const lat: number | null = coords?.[1] ?? null

    return NextResponse.json({
      address: addr.adressebetegnelse,
      sqm,
      propertyType,
      rooms,
      toilets,
      bathrooms,
      floors,
      lat,
      lon,
    })
  }

  return NextResponse.json({ error: "Ukendt mode" }, { status: 400 })
}
