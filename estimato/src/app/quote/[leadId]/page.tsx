import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import QuoteBooking from "./QuoteBooking"

export default async function QuotePage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params
  const supabase = await createServiceClient()

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, company_id, name, email, address, sqm, property_type, price, price_breakdown, action_type, status")
    .eq("id", leadId)
    .single()

  if (error || !lead) notFound()

  const { data: company } = await supabase
    .from("companies")
    .select("company_name, email, phone")
    .eq("id", lead.company_id)
    .single()

  if (!company) notFound()

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif" }}>
      <QuoteBooking
        leadId={leadId}
        companyId={lead.company_id}
        companyName={company.company_name}
        companyEmail={company.email}
        companyPhone={company.phone}
        customerName={lead.name}
        address={lead.address}
        sqm={lead.sqm}
        propertyType={lead.property_type}
        price={lead.price}
        priceBreakdown={lead.price_breakdown as Record<string, unknown> | null}
        alreadyBooked={lead.action_type === "book"}
      />
    </main>
  )
}
