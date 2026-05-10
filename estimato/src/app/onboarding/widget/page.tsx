import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OnboardingWidget from "./OnboardingWidget"

export default async function OnboardingWidgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return <OnboardingWidget companyId={user.id} />
}
