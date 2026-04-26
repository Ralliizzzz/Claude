import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { LeadRow } from "@/types/database"
import LeadsTable from "./LeadsTable"

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  let query = supabase
    .from("leads")
    .select("*")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false })

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const result = await query
  const leads = (result.data ?? []) as LeadRow[]

  // Tæl pr. status
  const countResult = await supabase
    .from("leads")
    .select("status")
    .eq("company_id", user.id)

  const counts = { all: 0, new: 0, contacted: 0, booked: 0 }
  for (const row of (countResult.data ?? []) as { status: string }[]) {
    counts.all++
    if (row.status in counts) counts[row.status as keyof typeof counts]++
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Leads</h1>
      <p className="text-sm text-gray-500 mb-6">Kunder der har udfyldt din tilbudsberegner.</p>
      <LeadsTable leads={leads} counts={counts} activeStatus={status ?? "all"} />
    </div>
  )
}
