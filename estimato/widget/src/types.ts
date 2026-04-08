export type PropertyType = "house" | "apartment" | "commercial"
export type ActionType = "book" | "callback" | "email"

export interface AddOn {
  id: string
  name: string
  price: number
}

export interface Discount {
  id: string
  name: string
  type: "percent" | "fixed"
  value: number
}

export interface IntervalRange {
  min: number
  max: number
  price: number
}

export interface QuoteSettings {
  pricing_type: "sqm" | "interval"
  price_per_sqm: number | null
  interval_ranges: IntervalRange[]
  add_ons: AddOn[]
  discounts: Discount[]
  minimum_price: number | null
}

export interface PriceBreakdown {
  base: number
  add_ons: { name: string; price: number }[]
  discount: { name: string; value: number } | null
  total: number
}

export type Step = "address" | "price" | "action" | "contact" | "confirmation"
