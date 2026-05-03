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
  price_per_m2: number
}

export interface FlatRange {
  min: number
  max: number
  price: number
}

export type FrequencyKey = "weekly" | "every2weeks" | "every3weeks" | "every4weeks"

export interface FrequencyDiscount {
  frequency: FrequencyKey
  discount_percentage: number
  enabled: boolean
}

export interface TransportFee {
  enabled: boolean
  base_distance_km: number
  price_per_km: number
}

export interface WidgetLocation {
  name: string
  lat: number
  lon: number
  max_distance_km: number
}

export interface QuoteSettings {
  pricing_type: "sqm" | "interval"
  price_per_sqm: number | null
  interval_ranges: IntervalRange[]
  flat_ranges: FlatRange[]
  add_ons: AddOn[]
  discounts: Discount[]
  minimum_price: number | null
  frequency_discounts: FrequencyDiscount[]
  locations?: WidgetLocation[]
  transport_fee: TransportFee
}

export interface PriceBreakdown {
  base: number
  add_ons: { name: string; price: number }[]
  discount: { name: string; value: number } | null
  frequency_discount: { name: string; value: number } | null
  transport_fee: { amount: number; distance_km: number; billable_km: number; price_per_km: number } | null
  total: number
}

export type Step = "address" | "price" | "action" | "contact" | "quote-summary" | "confirmation"
