import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CompanyRow } from "@/types/database"
import UpgradeButton from "./UpgradeButton"
import LogoutButton from "./LogoutButton"

const features = [
  "Automatisk BBR-opslag og prisberegning",
  "Leads og bookinger samlet ét sted",
  "SMS- og e-mailnotifikationer til kunder",
  "Nem installation — to linjer kode",
]

export default async function OpgraderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: company } = await supabase
    .from("companies")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  if ((company as Pick<CompanyRow, "subscription_status"> | null)?.subscription_status === "active") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">Estimato</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Din prøveperiode er udløbet
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Start dit abonnement for at fortsætte med at modtage leads og bookinger via din widget.
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <div className="mb-5">
            <span className="text-3xl font-bold text-gray-900">499 kr</span>
            <span className="text-base font-normal text-gray-500"> / måned inkl. moms</span>
            <p className="text-xs text-gray-400 mt-0.5">Kan opsiges når som helst</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-2.5 h-2.5 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </div>
            ))}
          </div>

          <UpgradeButton />
        </div>

        <p className="text-xs text-center text-gray-400">
          Spørgsmål?{" "}
          <a href="mailto:estimato@estimato.dk" className="underline hover:text-gray-600">
            estimato@estimato.dk
          </a>
        </p>

        <div className="mt-4 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
