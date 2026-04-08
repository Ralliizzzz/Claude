import type { QuoteSettings, PriceBreakdown } from "./types"

export function calculatePrice(
  sqm: number,
  settings: QuoteSettings,
  selectedAddOnIds: string[],
  selectedDiscountId: string | null
): PriceBreakdown {
  // Basispris
  let base = 0
  if (settings.pricing_type === "sqm" && settings.price_per_sqm) {
    base = Math.round(sqm * settings.price_per_sqm)
  } else if (settings.pricing_type === "interval") {
    const range = settings.interval_ranges.find(
      (r) => sqm >= r.min && sqm <= r.max
    )
    base = range?.price ?? 0
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

  const total = base + addOnTotal + (discount?.value ?? 0)

  return { base, add_ons: addOns, discount, total: Math.max(0, total) }
}
