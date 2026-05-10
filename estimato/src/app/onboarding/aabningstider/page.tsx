import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { QuoteSettingsRow } from "@/types/database"
import type { OpeningHours, DayKey } from "@/types/settings"
import OnboardingAabningstider from "./OnboardingAabningstider"

const DEFAULT_HOURS: OpeningHours = {
  mon: { open: "08:00", close: "16:00" },
  tue: { open: "08:00", close: "16:00" },
  wed: { open: "08:00", close: "16:00" },
  thu: { open: "08:00", close: "16:00" },
  fri: { open: "08:00", close: "16:00" },
  sat: null,
  sun: null,
}

export default async function OnboardingAabningstiderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: row } = await supabase
    .from("quote_settings")
    .select("opening_hours")
    .eq("company_id", user.id)
    .single() as { data: Pick<QuoteSettingsRow, "opening_hours"> | null }

  const stored = row?.opening_hours as unknown as OpeningHours | null
  const hasHours = stored && (Object.keys(stored) as DayKey[]).some((d) => stored[d] !== null)

  return <OnboardingAabningstider initialHours={hasHours ? stored : DEFAULT_HOURS} />
}
