export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PricingType = "sqm" | "interval"
export type LeadStatus = "new" | "contacted" | "booked"
export type LeadAction = "book" | "callback" | "email"
export type SubscriptionStatus = "trial" | "active" | "cancelled" | "expired"

export interface CompanyRow {
  id: string
  company_name: string
  email: string
  phone: string | null
  subscription_status: SubscriptionStatus
  trial_end_date: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface QuoteSettingsRow {
  id: string
  company_id: string
  pricing_type: PricingType
  price_per_sqm: number | null
  interval_ranges: Json
  flat_ranges: Json
  add_ons: Json
  discounts: Json
  minimum_price: number | null
  opening_hours: Json
  frequency_discounts: Json
  main_location: Json
  branch_locations: Json
  updated_at: string
}

export interface LeadRow {
  id: string
  company_id: string
  name: string
  email: string | null
  phone: string | null
  address: string
  sqm: number | null
  property_type: "house" | "apartment" | "commercial" | null
  price: number
  price_breakdown: Json
  action_type: LeadAction
  status: LeadStatus
  created_at: string
}

export interface BookingRow {
  id: string
  company_id: string
  lead_id: string
  scheduled_at: string
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
}

type Rel = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: CompanyRow
        Insert: Omit<CompanyRow, "created_at">
        Update: Partial<Omit<CompanyRow, "id" | "created_at">>
        Relationships: Rel[]
      }
      quote_settings: {
        Row: QuoteSettingsRow
        Insert: Omit<QuoteSettingsRow, "id" | "updated_at">
        Update: Partial<Omit<QuoteSettingsRow, "id" | "company_id" | "updated_at">>
        Relationships: Rel[]
      }
      leads: {
        Row: LeadRow
        Insert: Omit<LeadRow, "id" | "created_at">
        Update: Partial<Omit<LeadRow, "id" | "company_id" | "created_at">>
        Relationships: Rel[]
      }
      bookings: {
        Row: BookingRow
        Insert: Omit<BookingRow, "id" | "created_at">
        Update: Partial<Omit<BookingRow, "id" | "company_id" | "created_at">>
        Relationships: Rel[]
      }
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: Rel[] }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: Record<string, string>
  }
}
