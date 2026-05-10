"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import WizardShell from "../WizardShell"
import { saveSettings } from "@/app/dashboard/settings/actions"
import type { OpeningHours, DayKey } from "@/types/settings"

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Mandag", tue: "Tirsdag", wed: "Onsdag", thu: "Torsdag",
  fri: "Fredag", sat: "Lørdag", sun: "Søndag",
}
const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

export default function OnboardingAabningstider({ initialHours }: { initialHours: OpeningHours }) {
  const router = useRouter()
  const [hours, setHours] = useState<OpeningHours>(initialHours)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(day: DayKey) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "08:00", close: "16:00" },
    }))
  }

  function setTime(day: DayKey, field: "open" | "close", val: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { open: "08:00", close: "16:00" }), [field]: val },
    }))
  }

  async function handleNext() {
    setSaving(true)
    setError(null)
    const result = await saveSettings(hours)
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    router.push("/onboarding/widget")
  }

  return (
    <WizardShell
      step={3}
      title="Åbningstider"
      subtitle="Kunder kan kun booke inden for disse tider. Du kan altid justere dem."
      onNext={handleNext}
      saving={saving}
      backHref="/onboarding/adresse"
    >
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {DAYS.map((day, i) => {
          const active = hours[day] !== null
          return (
            <div
              key={day}
              className={`flex items-center gap-4 px-4 py-3 ${i < DAYS.length - 1 ? "border-b border-gray-100" : ""} ${active ? "" : "bg-gray-50/50"}`}
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggle(day)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${active ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-4" : ""}`} />
              </button>

              {/* Dag */}
              <span className={`w-20 text-sm font-medium flex-shrink-0 ${active ? "text-gray-900" : "text-gray-400"}`}>
                {DAY_LABELS[day]}
              </span>

              {/* Tider */}
              {active ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[day]?.open ?? "08:00"}
                    onChange={(e) => setTime(day, "open", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="time"
                    value={hours[day]?.close ?? "16:00"}
                    onChange={(e) => setTime(day, "close", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">Lukket</span>
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
      )}
    </WizardShell>
  )
}
