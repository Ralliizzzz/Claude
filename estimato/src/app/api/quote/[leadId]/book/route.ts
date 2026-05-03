import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendBookingEmailToCustomer, sendLeadEmailToCompany, sendLeadSmsToCompany } from "@/lib/notify"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params
  const { scheduled_at } = await req.json()

  if (!scheduled_at) {
    return NextResponse.json({ error: "Manglende tidspunkt" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, company_id, name, email, phone, address, sqm, property_type, price, price_breakdown, action_type, notes, status, created_at")
    .eq("id", leadId)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead ikke fundet" }, { status: 404 })
  }

  const { data: company } = await supabase
    .from("companies")
    .select("company_name, email, phone")
    .eq("id", lead.company_id)
    .single()

  if (!company) {
    return NextResponse.json({ error: "Virksomhed ikke fundet" }, { status: 404 })
  }

  const { error: bookingError } = await supabase
    .from("bookings")
    .insert({
      company_id: lead.company_id,
      lead_id: leadId,
      scheduled_at,
      status: "pending",
    })

  if (bookingError) {
    console.error("Booking insert fejl:", bookingError)
    return NextResponse.json({ error: "Booking fejlede" }, { status: 500 })
  }

  await supabase
    .from("leads")
    .update({ action_type: "book" })
    .eq("id", leadId)

  const updatedLead = { ...lead, action_type: "book" }

  await Promise.allSettled([
    sendBookingEmailToCustomer(company, updatedLead, scheduled_at),
    sendLeadEmailToCompany(company, updatedLead),
    sendLeadSmsToCompany(company, updatedLead),
  ])

  return NextResponse.json({ success: true }, {
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
