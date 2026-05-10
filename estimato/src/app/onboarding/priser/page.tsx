import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { IntervalRange, TransportFee } from "@/types/settings"
import OnboardingPriser from "./OnboardingPriser"

export default async function OnboardingPriserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: row } = await supabase
    .from("quote_settings")
    .select("pricing_type, price_per_sqm, interval_ranges, minimum_price, transport_fee")
    .eq("company_id", user.id)
    .single() as { data: Pick<QuoteSettingsRow, "pricing_type" | "price_per_sqm" | "interval_ranges" | "minimum_price" | "transport_fee"> | null }

  return (
    <OnboardingPriser
      initialPricingType={(row?.pricing_type ?? "sqm") as "sqm" | "interval"}
      initialPricePerSqm={row?.price_per_sqm ?? null}
      initialIntervalRanges={(row?.interval_ranges ?? []) as unknown as IntervalRange[]}
      initialMinimumPrice={row?.minimum_price ?? null}
      initialTransportFee={((row?.transport_fee ?? {}) as unknown as Partial<TransportFee>).enabled !== undefined
        ? (row!.transport_fee as unknown as TransportFee)
        : { enabled: false, base_distance_km: 0, price_per_km: 0 }}
    />
  )
}
