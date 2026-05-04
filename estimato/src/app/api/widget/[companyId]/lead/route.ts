import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import {
  sendLeadEmailToCompany,
  sendLeadSmsToCompany,
  sendQuoteEmailToCustomer,
  sendBookingEmailToCustomer,
} from "@/lib/notify"
import { getDurationMinutes } from "@/lib/duration"
import type { DurationRange } from "@/lib/duration"
import type { CompanyRow, LeadRow } from "@/types/database"
import { computeLogistics } from "@/lib/maps"
import type { Location } from "@/types/settings"

interface LeadPayload {
  name: string
  email?: string
  phone?: string
  address: string
  sqm?: number
  property_type?: "house" | "apartment" | "commercial"
  price: number
  price_breakdown: Record<string, unknown>
  action_type: "book" | "callback" | "email"
  scheduled_at?: string
  notes?: string
  lat?: number | null
  lon?: number | null
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const body: LeadPayload = await req.json()

  if (!body.name || !body.address || body.price == null || !body.action_type) {
    return NextResponse.json({ error: "Manglende felter" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Hent indstillinger (lokationer + rengøringstid) parallelt med lead-oprettelse
  const [settingsResult] = await Promise.all([
    supabase
      .from("quote_settings")
      .select("duration_ranges, main_location, branch_locations")
      .eq("company_id", companyId)
      .single(),
  ])

  // Beregn logistik hvis koordinater er tilgængelige
  let logistics: { nearest_branch: string; distance_km: number; drive_minutes: number } | null = null
  if (body.lat != null && body.lon != null && settingsResult.data) {
    const mainLocation = settingsResult.data.main_location as unknown as Location
    const branchLocations = (settingsResult.data.branch_locations ?? []) as unknown as Location[]
    if (mainLocation?.lat != null && mainLocation?.lon != null) {
      logistics = await computeLogistics(body.lat, body.lon, mainLocation, branchLocations)
    }
  }

  // Opret lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      company_id: companyId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address,
      sqm: body.sqm ?? null,
      property_type: body.property_type ?? null,
      price: body.price,
      price_breakdown: body.price_breakdown as unknown as import("@/types/database").Json,
      action_type: body.action_type,
      status: "new",
      ...(body.notes ? { notes: body.notes } : {}),
      ...(logistics ? { logistics } : {}),
    })
    .select("id")
    .single()

  if (leadError || !lead) {
    console.error("Lead insert fejl:", leadError)
    return NextResponse.json({ error: "Kunne ikke oprette lead" }, { status: 500 })
  }

  // Opret booking hvis action_type er 'book'
  if (body.action_type === "book" && body.scheduled_at) {
    await supabase.from("bookings").insert({
      company_id: companyId,
      lead_id: lead.id,
      scheduled_at: body.scheduled_at,
      status: "pending",
    })
  }

  // Send notifikationer
  const companyResult = await supabase
    .from("companies")
    .select("company_name, email, phone")
    .eq("id", companyId)
    .single()

  const company = companyResult.data as Pick<CompanyRow, "company_name" | "email" | "phone"> | null
  const durationRanges = ((settingsResult.data?.duration_ranges ?? []) as DurationRange[])
  const durationMinutes = getDurationMinutes(body.sqm ?? null, durationRanges)

  if (company) {
    const fullLead: LeadRow = {
      id: lead.id,
      company_id: companyId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address,
      sqm: body.sqm ?? null,
      property_type: body.property_type ?? null,
      price: body.price,
      price_breakdown: body.price_breakdown as unknown as import("@/types/database").Json,
      action_type: body.action_type,
      notes: body.notes ?? null,
      status: "new",
      logistics: null,
      created_at: new Date().toISOString(),
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato.dk"
    const quoteUrl = `${appUrl}/quote/${lead.id}`

    const results = await Promise.allSettled([
      sendLeadEmailToCompany(company, fullLead),
      sendLeadSmsToCompany(company, fullLead),
      body.action_type === "email"
        ? sendQuoteEmailToCustomer(company, { ...fullLead, price_breakdown: body.price_breakdown }, quoteUrl)
        : body.action_type === "book" && body.scheduled_at
        ? sendBookingEmailToCustomer(company, fullLead, body.scheduled_at, durationMinutes)
        : Promise.resolve(),
    ])
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[notify] Notifikation ${i} fejlede:`, r.reason)
      }
    })
  }

  return NextResponse.json(
    { success: true, lead_id: lead.id },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  )
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
