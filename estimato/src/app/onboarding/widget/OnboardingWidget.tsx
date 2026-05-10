"use client"

import { useState } from "react"
import WizardShell from "../WizardShell"
import { completeOnboarding } from "../actions"

export default function OnboardingWidget({ companyId }: { companyId: string }) {
  const [copied, setCopied] = useState(false)
  const [completing, setCompleting] = useState(false)

  const embedCode = `<div id="lead-widget" data-company="${companyId}"></div>\n<script src="https://estimato-xi.vercel.app/widget.js?v=6"></script>`

  function handleCopy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNext() {
    setCompleting(true)
    await completeOnboarding()
  }

  return (
    <WizardShell
      step={4}
      title="Installer din widget"
      subtitle="Kopiér koden og indsæt den på din hjemmeside. Widgetten er live med det samme."
      onNext={handleNext}
      nextLabel="Gå til dashboard →"
      saving={completing}
      backHref="/onboarding/aabningstider"
    >
      {/* Trin */}
      <div className="flex flex-col gap-4 mb-6">
        {[
          { n: "1", title: "Kopiér koden nedenfor", desc: "Tryk på Kopiér-knappen for at kopiere din personlige embed-kode." },
          { n: "2", title: "Indsæt på din hjemmeside", desc: "Indsæt koden i HTML'en der, hvor du vil vise beregneren." },
          { n: "3", title: "Du er klar!", desc: "Kunder kan nu udfylde beregneren og sende dig forespørgsler direkte." },
        ].map((s) => (
          <div key={s.n} className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {s.n}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Embed-kode */}
      <div className="relative">
        <pre className="bg-gray-950 text-gray-100 text-xs rounded-xl p-4 pr-24 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            copied
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Kopieret
            </span>
          ) : "Kopiér"}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Kan du ikke installere den nu? Tryk på &quot;Gå til dashboard&quot; — koden finder du altid under <strong>Installer widget</strong>.
      </p>
    </WizardShell>
  )
}
