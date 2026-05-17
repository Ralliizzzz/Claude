import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/app/admin/login/actions"
import { createServiceClient } from "@/lib/supabase/server"

const CVR_API = "http://distribution.virk.dk/cvr-permanent/vrvirksomhed/_search"
const CLEANING_CODES = ["812100", "812200", "812900"]

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

export async function POST(req: NextRequest) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })

  const { city, postalCode, limit = 50 } = await req.json()

  const username = process.env.CVR_API_USERNAME
  const password = process.env.CVR_API_PASSWORD

  const mustFilters: object[] = [
    { terms: { "Vrvirksomhed.nyesteHovedbranche.branchekode": CLEANING_CODES } },
  ]

  if (city?.trim()) {
    mustFilters.push({
      match: {
        "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse.postdistrikt": city.trim().toUpperCase(),
      },
    })
  }
  if (postalCode?.trim()) {
    mustFilters.push({
      term: {
        "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse.postnummer": postalCode.trim(),
      },
    })
  }

  const query = {
    from: 0,
    size: Math.min(Number(limit) || 50, 100),
    query: {
      bool: {
        must: mustFilters,
        filter: [{ term: { "Vrvirksomhed.virksomhedsstatus.statuskode": "NORMAL" } }],
      },
    },
    _source: [
      "Vrvirksomhed.cvrNummer",
      "Vrvirksomhed.virksomhedMetadata.nyesteNavn.navn",
      "Vrvirksomhed.virksomhedMetadata.nyesteBeliggenhedsadresse",
      "Vrvirksomhed.telefonNummer",
      "Vrvirksomhed.elektroniskPost",
    ],
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (username && password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
  }

  let cvrRes: Response
  try {
    cvrRes = await fetch(CVR_API, {
      method: "POST",
      headers,
      body: JSON.stringify(query),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ error: "Kunne ikke forbinde til CVR API" }, { status: 502 })
  }

  if (!cvrRes.ok) {
    const text = await cvrRes.text().catch(() => "")
    if (cvrRes.status === 401) {
      return NextResponse.json(
        { error: "CVR API kræver login. Opret gratis adgang på datacvr.virk.dk/datservice og tilføj CVR_API_USERNAME og CVR_API_PASSWORD i Vercel miljøvariabler." },
        { status: 502 }
      )
    }
    return NextResponse.json({ error: `CVR API fejl ${cvrRes.status}: ${text.slice(0, 200)}` }, { status: 502 })
  }

  const data = await cvrRes.json()
  const hits: unknown[] = data.hits?.hits ?? []

  const supabase = await createServiceClient()
  const { data: existing } = await supabase.from("prospects").select("source").like("source", "cvr-%")
  const importedSet = new Set(
    (existing ?? []).map((p) => p.source?.replace("cvr-", "")).filter(Boolean)
  )

  const companies: CvrCompany[] = hits.map((hit: any) => {
    const v = hit._source?.Vrvirksomhed ?? {}
    const meta = v.virksomhedMetadata ?? {}
    const addr = meta.nyesteBeliggenhedsadresse ?? {}
    const cvrNumber = String(v.cvrNummer ?? "")
    const street = [addr.vejnavn, addr.husnummerFra].filter(Boolean).join(" ")
    const phone = v.telefonNummer?.[0]?.kontaktoplysning ?? null
    const email = v.elektroniskPost?.[0]?.kontaktoplysning ?? null

    return {
      cvrNumber,
      companyName: meta.nyesteNavn?.navn ?? "Ukendt",
      address: street,
      city: addr.postdistrikt ?? "",
      postalCode: String(addr.postnummer ?? ""),
      phone,
      email,
      alreadyImported: importedSet.has(cvrNumber),
    }
  })

  return NextResponse.json({ companies, total: data.hits?.total?.value ?? companies.length })
}
