import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from("quote_settings")
    .select("pricing_type, price_per_sqm, interval_ranges, add_ons, discounts, minimum_price")
    .eq("company_id", companyId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Virksomhed ikke fundet" }, { status: 404 })
  }

  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  })
}
