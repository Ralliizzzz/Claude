// Delte settings-typer brugt af dashboard OG widget API
// Widget importerer fra widget/src/types.ts (samme shape, ingen cross-import)

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

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
export type OpeningHours = Record<DayKey, { open: string; close: string } | null>

export interface Location {
  name: string
  street_address: string
  postal_code: string
  city: string
  country: string
  lat: number | null
  lon: number | null
  max_distance_km: number
}

export type FrequencyKey = "weekly" | "every2weeks" | "every3weeks" | "every4weeks"

export interface FrequencyDiscount {
  frequency: FrequencyKey
  discount_percentage: number
  enabled: boolean
}

export interface QuoteSettingsData {
  pricing_type: "sqm" | "interval"
  price_per_sqm: number | null
  interval_ranges: IntervalRange[]
  flat_ranges: FlatRange[]
  add_ons: AddOn[]
  discounts: Discount[]
  minimum_price: number | null
  opening_hours: OpeningHours
  frequency_discounts: FrequencyDiscount[]
  main_location: Location
  branch_locations: Location[]
}
