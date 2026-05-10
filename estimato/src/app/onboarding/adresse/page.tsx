import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { Location } from "@/types/settings"
import type { CompanyRow } from "@/types/database"
import OnboardingAdresse from "./OnboardingAdresse"

const EMPTY_LOCATION: Location = {
  name: "", street_address: "", postal_code: "", city: "",
  country: "Danmark", lat: null, lon: null, max_distance_km: 0,
}

export default async function OnboardingAdressePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [settingsResult, companyResult] = await Promise.all([
    supabase.from("quote_settings").select("main_location").eq("company_id", user.id).single(),
    supabase.from("companies").select("company_name").eq("id", user.id).single(),
  ])

  const row = settingsResult.data as Pick<QuoteSettingsRow, "main_location"> | null
  const company = companyResult.data as Pick<CompanyRow, "company_name"> | null

  const mainLocation = (row?.main_location ?? EMPTY_LOCATION) as unknown as Location

  return (
    <OnboardingAdresse
      initialLocation={mainLocation}
      companyName={company?.company_name ?? ""}
    />
  )
}
