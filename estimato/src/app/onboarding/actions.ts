"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  await supabase
    .from("companies")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id)

  redirect("/dashboard")
}
