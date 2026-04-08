import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

interface LeadPayload {
  name: string
  email?: string
  phone?: string
  address: string
  sqm?: number
  property_type?: "house" | "apartment" | "commercial"
  price: number
  price_breakdown: object
  action_type: "book" | "callback" | "email"
  scheduled_at?: string // kun ved booking
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const body: LeadPayload = await req.json()

  // Validér påkrævede felter
  if (!body.name || !body.address || body.price == null || !body.action_type) {
    return NextResponse.json({ error: "Manglende felter" }, { status: 400 })
  }

  const supabase = await createServiceClient()

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
      price_breakdown: body.price_breakdown,
      action_type: body.action_type,
      status: "new",
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

  return NextResponse.json({ success: true, lead_id: lead.id }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
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
