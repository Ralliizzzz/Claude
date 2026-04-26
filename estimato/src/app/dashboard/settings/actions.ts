"use server"

import { createClient } from "@/lib/supabase/server"
import type { OpeningHours, Location } from "@/types/settings"

export async function saveContactInfo(
  companyName: string,
  email: string,
  phone: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Ikke autoriseret" }

  const { error } = await supabase
    .from("companies")
    .update({ company_name: companyName, email, phone: phone || null })
    .eq("id", user.id)

  if (error) return { error: "Kunne ikke gemme kontaktoplysninger" }
  return {}
}

const DAWA_BASE = "https://api.dataforsyningen.dk"

async function geocodeLocation(loc: Location): Promise<Location> {
  if (!loc.street_address && !loc.postal_code && !loc.city) return loc
  try {
    const q = [loc.street_address, loc.postal_code, loc.city].filter(Boolean).join(" ")
    const res = await fetch(
      `${DAWA_BASE}/adresser?q=${encodeURIComponent(q)}&per_side=1&struktur=mini`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return loc
    const data = await res.json()
    const first = Array.isArray(data) ? data[0] : null
    if (!first?.x || !first?.y) return loc
    return { ...loc, lon: first.x, lat: first.y }
  } catch {
    return loc
  }
}

export async function saveSettings(openingHours: OpeningHours): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Ikke autoriseret" }

  const { error } = await supabase
    .from("quote_settings")
    .update({ opening_hours: openingHours })
    .eq("company_id", user.id)

  if (error) return { error: "Kunne ikke gemme indstillinger" }
  return {}
}

export async function saveServiceArea(
  mainLocation: Location,
  branchLocations: Location[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Ikke autoriseret" }

  const geocodedMain = await geocodeLocation(mainLocation)
  const geocodedBranches = await Promise.all(branchLocations.map(geocodeLocation))

  const { error } = await supabase
    .from("quote_settings")
    .update({
      main_location: geocodedMain,
      branch_locations: geocodedBranches,
    })
    .eq("company_id", user.id)

  if (error) return { error: "Kunne ikke gemme serviceområde" }
  return {}
}
