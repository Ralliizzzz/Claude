"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { SubscriptionStatus, ProspectStatus } from "@/types/database"
import { isAdminAuthenticated } from "./login/actions"

async function assertAdmin() {
  const ok = await isAdminAuthenticated()
  if (!ok) throw new Error("Ikke autoriseret")
}

export async function extendTrial(companyId: string, days: number) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const { data: company } = await supabase
    .from("companies")
    .select("trial_end_date")
    .eq("id", companyId)
    .single()
  const base = company?.trial_end_date
    ? Math.max(new Date(company.trial_end_date).getTime(), Date.now())
    : Date.now()
  const newEnd = new Date(base + days * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from("companies")
    .update({ trial_end_date: newEnd, subscription_status: "trial" })
    .eq("id", companyId)
  if (error) throw error
  revalidatePath("/admin/companies")
}

export async function setStatus(companyId: string, status: SubscriptionStatus) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from("companies")
    .update({ subscription_status: status })
    .eq("id", companyId)
  if (error) throw error
  revalidatePath("/admin/companies")
}

export async function deleteCompany(companyId: string) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const { error } = await supabase.auth.admin.deleteUser(companyId)
  if (error) throw error
  revalidatePath("/admin/companies")
}

export async function addProspect(data: {
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  city?: string
  website?: string
  source?: string
  notes?: string
}) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const { error } = await supabase.from("prospects").insert(data)
  if (error) throw error
  revalidatePath("/admin/prospects")
}

export async function updateProspectStatus(id: string, status: ProspectStatus) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const update: Record<string, unknown> = { status }
  if (status !== "not_contacted") {
    update.last_contacted_at = new Date().toISOString()
  }
  const { error } = await supabase.from("prospects").update(update).eq("id", id)
  if (error) throw error
  revalidatePath("/admin/prospects")
}

export async function updateProspectNotes(id: string, notes: string) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const { error } = await supabase.from("prospects").update({ notes }).eq("id", id)
  if (error) throw error
  revalidatePath("/admin/prospects")
}

export async function deleteProspect(id: string) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const { error } = await supabase.from("prospects").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/admin/prospects")
}

export async function bulkImportProspects(companies: {
  companyName: string
  city?: string
  phone?: string
  email?: string
  cvrNumber: string
}[]) {
  await assertAdmin()
  const supabase = await createServiceClient()
  const rows = companies.map((c) => ({
    company_name: c.companyName,
    city: c.city || null,
    phone: c.phone || null,
    email: c.email || null,
    source: `cvr-${c.cvrNumber}`,
  }))
  const { error } = await supabase.from("prospects").insert(rows)
  if (error) throw error
  revalidatePath("/admin/prospects")
}

export async function submitFeedback(message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Ikke logget ind")
  const { error } = await supabase
    .from("feedback")
    .insert({ company_id: user.id, message })
  if (error) throw error
}
