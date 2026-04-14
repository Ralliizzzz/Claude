import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { AddOn, Discount, IntervalRange, FlatRange } from "@/types/settings"
import PriserForm from "./PriserForm"

export default async function PriserPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const result = await supabase
    .from("quote_settings")
    .select("*")
    .eq("company_id", user.id)
    .single()

  const row = result.data as QuoteSettingsRow | null

  const initialData = {
    pricing_type: (row?.pricing_type ?? "interval") as "sqm" | "interval",
    price_per_sqm: row?.price_per_sqm ?? null,
    interval_ranges: (row?.interval_ranges ?? []) as unknown as IntervalRange[],
    flat_ranges: (row?.flat_ranges ?? []) as unknown as FlatRange[],
    add_ons: (row?.add_ons ?? []) as unknown as AddOn[],
    discounts: (row?.discounts ?? []) as unknown as Discount[],
    minimum_price: row?.minimum_price ?? null,
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Priser og tillæg</h1>
      <p className="text-sm text-gray-500 mb-8">
        Ændringer træder i kraft i widget&apos;en inden for 60 sekunder.
      </p>
      <PriserForm initialData={initialData} />
    </div>
  )
}
