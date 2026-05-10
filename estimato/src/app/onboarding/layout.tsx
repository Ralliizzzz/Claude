import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: company } = await supabase
    .from("companies")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (company?.onboarding_completed_at) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">Estimato</span>
        </div>
      </header>
      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
