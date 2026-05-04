import type { QuoteSettings, PriceBreakdown } from "./types"

// Sættes ved mount() i index.tsx — detekteres fra script-taggets src
let BASE = ""
export function setApiBase(url: string) {
  BASE = url
}

export async function fetchSettings(companyId: string): Promise<QuoteSettings> {
  const res = await fetch(`${BASE}/api/widget/${companyId}/settings`)
  if (!res.ok) throw new Error("Kunne ikke hente indstillinger")
  return res.json()
}

export async function fetchAddressSuggestions(
  q: string
): Promise<{ text: string; id: string }[]> {
  if (q.length < 3) return []
  const res = await fetch(`${BASE}/api/bbr?mode=autocomplete&q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchBBRData(
  id: string
): Promise<{ address: string; sqm: number | null; propertyType: string | null; rooms: number | null; toilets: number | null; bathrooms: number | null; floors: number | null; lat: number | null; lon: number | null }> {
  const res = await fetch(`${BASE}/api/bbr?mode=lookup&id=${id}`)
  if (!res.ok) throw new Error("BBR-opslag fejlede")
  return res.json()
}

export async function fetchAvailableDates(companyId: string, sqm?: number): Promise<string[]> {
  const params = new URLSearchParams({ mode: "dates" })
  if (sqm) params.set("sqm", String(sqm))
  const res = await fetch(`${BASE}/api/widget/${companyId}/slots?${params}`)
  if (!res.ok) return []
  return res.json()
}

export async function fetchSlotsForDate(companyId: string, date: string, sqm?: number): Promise<string[]> {
  const params = new URLSearchParams({ date })
  if (sqm) params.set("sqm", String(sqm))
  const res = await fetch(`${BASE}/api/widget/${companyId}/slots?${params}`)
  if (!res.ok) return []
  return res.json()
}

export async function bookLead(leadId: string, scheduledAt: string): Promise<void> {
  const res = await fetch(`${BASE}/api/quote/${leadId}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  })
  if (!res.ok) throw new Error("Booking fejlede")
}

export async function submitLead(
  companyId: string,
  payload: {
    name: string
    email?: string
    phone?: string
    address: string
    sqm?: number
    property_type?: string
    price: number
    price_breakdown: PriceBreakdown
    action_type: "book" | "callback" | "email"
    scheduled_at?: string
    notes?: string
    lat?: number | null
    lon?: number | null
  }
): Promise<{ success: boolean; lead_id: string }> {
  const res = await fetch(`${BASE}/api/widget/${companyId}/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Kunne ikke sende forespørgsel")
  return res.json()
}
