import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { OpeningHours, Location } from "@/types/settings"
import SettingsForm from "./SettingsForm"

const EMPTY_LOCATION: Location = {
  name: "",
  street_address: "",
  postal_code: "",
  city: "",
  country: "Danmark",
  lat: null,
  lon: null,
  max_distance_km: 0,
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [result, companyResult] = await Promise.all([
    supabase
      .from("quote_settings")
      .select("opening_hours, main_location, branch_locations")
      .eq("company_id", user.id)
      .single(),
    supabase
      .from("companies")
      .select("company_name, email, phone")
      .eq("id", user.id)
      .single(),
  ])

  const row = result.data as Pick<QuoteSettingsRow, "opening_hours" | "main_location" | "branch_locations"> | null
  const company = companyResult.data

  const openingHours = (row?.opening_hours ?? {
    mon: { open: "08:00", close: "16:00" },
    tue: { open: "08:00", close: "16:00" },
    wed: { open: "08:00", close: "16:00" },
    thu: { open: "08:00", close: "16:00" },
    fri: { open: "08:00", close: "16:00" },
    sat: null,
    sun: null,
  }) as unknown as OpeningHours

  const mainLocation = (row?.main_location && Object.keys(row.main_location as object).length > 0
    ? row.main_location
    : EMPTY_LOCATION) as unknown as Location

  const branchLocations = (row?.branch_locations ?? []) as unknown as Location[]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Indstillinger</h1>
      <p className="text-sm text-gray-500 mb-8">
        Konfigurer serviceområde, åbningstider og embed-kode til din widget.
      </p>
      <SettingsForm
        initialOpeningHours={openingHours}
        initialMainLocation={mainLocation}
        initialBranchLocations={branchLocations}
        companyId={user.id}
        initialCompanyName={company?.company_name ?? ""}
        initialEmail={company?.email ?? ""}
        initialPhone={company?.phone ?? ""}
      />
    </div>
  )
}
