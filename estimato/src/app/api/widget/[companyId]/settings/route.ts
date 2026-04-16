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
    .select("pricing_type, price_per_sqm, interval_ranges, flat_ranges, add_ons, discounts, minimum_price, frequency_discounts, main_location, branch_locations")
    .eq("company_id", companyId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Virksomhed ikke fundet" }, { status: 404 })
  }

  // Build active locations (must have coordinates and a positive max distance)
  type RawLoc = { lat?: number | null; lon?: number | null; max_distance_km?: number; name?: string }
  const mainLoc = data.main_location as RawLoc | null
  const branchLocs = (data.branch_locations ?? []) as RawLoc[]

  const locations = [
    ...(mainLoc?.lat && mainLoc?.lon && (mainLoc.max_distance_km ?? 0) > 0 ? [mainLoc] : []),
    ...branchLocs.filter((b) => b.lat && b.lon && (b.max_distance_km ?? 0) > 0),
  ].map((l) => ({ name: l.name ?? "", lat: l.lat, lon: l.lon, max_distance_km: l.max_distance_km }))

  const { main_location: _ml, branch_locations: _bl, ...rest } = data as typeof data & { main_location: unknown; branch_locations: unknown }

  const filtered = {
    ...rest,
    add_ons: (data.add_ons as { price: number }[]).filter((a) => a.price > 0),
    frequency_discounts: ((data.frequency_discounts ?? []) as { enabled: boolean; discount_percentage: number }[])
      .filter((f) => f.enabled && f.discount_percentage > 0),
    ...(locations.length > 0 ? { locations } : {}),
  }

  return NextResponse.json(filtered, {
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
