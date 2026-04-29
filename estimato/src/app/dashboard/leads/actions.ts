"use server"

import { createClient } from "@/lib/supabase/server"
import type { LeadRow } from "@/types/database"

export async function updateLeadStatus(
  leadId: string,
  status: LeadRow["status"]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Ikke autoriseret")

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("company_id", user.id)

  if (error) throw new Error("Kunne ikke opdatere status")
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Ikke autoriseret")

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("company_id", user.id)

  if (error) throw new Error("Kunne ikke slette lead")
}
