import type { QuoteSettings, PriceBreakdown, FrequencyKey } from "./types"

export function calculatePrice(
  sqm: number,
  settings: QuoteSettings,
  selectedAddOnIds: string[],
  selectedDiscountId: string | null,
  selectedFrequency: FrequencyKey | null = null,
  distanceKm: number | null = null
): PriceBreakdown {
  // Basispris
  let base = 0
  if (settings.pricing_type === "sqm") {
    const range = settings.flat_ranges.find((r) => sqm >= r.min && sqm <= r.max)
    base = range?.price ?? 0
  } else if (settings.pricing_type === "interval") {
    const range = settings.interval_ranges.find(
      (r) => sqm >= r.min && sqm <= r.max
    )
    base = range ? Math.round(sqm * range.price_per_m2) : 0
  }

  // Minimum pris
  if (settings.minimum_price && base < settings.minimum_price) {
    base = settings.minimum_price
  }

  // Tilvalg
  const addOns = settings.add_ons
    .filter((a) => selectedAddOnIds.includes(a.id))
    .map((a) => ({ name: a.name, price: a.price }))
  const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0)

  // Rabat
  let discount: { name: string; value: number } | null = null
  if (selectedDiscountId) {
    const d = settings.discounts.find((d) => d.id === selectedDiscountId)
    if (d) {
      const value =
        d.type === "percent"
          ? -Math.round(((base + addOnTotal) * d.value) / 100)
          : -d.value
      discount = { name: d.name, value }
    }
  }

  // Hyppighedsrabat
  const FREQUENCY_LABELS: Record<FrequencyKey, string> = {
    weekly: "Ugentlig",
    every2weeks: "Hver 2. uge",
    every3weeks: "Hver 3. uge",
    every4weeks: "Hver 4. uge",
  }
  let frequency_discount: { name: string; value: number } | null = null
  if (selectedFrequency) {
    const fd = settings.frequency_discounts.find((f) => f.frequency === selectedFrequency)
    if (fd && fd.enabled && fd.discount_percentage > 0) {
      const subtotal = base + addOnTotal + (discount?.value ?? 0)
      const value = -Math.round((subtotal * fd.discount_percentage) / 100)
      frequency_discount = { name: FREQUENCY_LABELS[selectedFrequency], value }
    }
  }

  // Transportgebyr
  let transport_fee: PriceBreakdown["transport_fee"] = null
  const tf = settings.transport_fee
  if (tf?.enabled && tf.price_per_km > 0 && distanceKm !== null) {
    const billableKm = Math.max(0, distanceKm - (tf.base_distance_km ?? 0))
    const amount = Math.round(billableKm * tf.price_per_km)
    if (amount > 0) {
      transport_fee = {
        amount,
        distance_km: Math.round(distanceKm * 10) / 10,
        billable_km: Math.round(billableKm * 10) / 10,
        price_per_km: tf.price_per_km,
      }
    }
  }

  const total = base + addOnTotal + (discount?.value ?? 0) + (frequency_discount?.value ?? 0) + (transport_fee?.amount ?? 0)

  return { base, add_ons: addOns, discount, frequency_discount, transport_fee, total: Math.max(0, total) }
}
