"use client"

import Link from "next/link"
import { completeOnboarding } from "./actions"

const STEPS = [
  { label: "Priser", href: "/onboarding/priser" },
  { label: "Adresse", href: "/onboarding/adresse" },
  { label: "Åbningstider", href: "/onboarding/aabningstider" },
  { label: "Widget", href: "/onboarding/widget" },
]

interface Props {
  step: 1 | 2 | 3 | 4
  title: string
  subtitle: string
  children: React.ReactNode
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  saving?: boolean
  backHref?: string
}

export default function WizardShell({
  step, title, subtitle, children,
  onNext, nextLabel = "Fortsæt →", nextDisabled = false, saving = false,
  backHref,
}: Props) {
  const progress = (step / 4) * 100

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Progress */}
      <div className="px-8 pt-7 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trin {step} af 4</span>
          <span className="text-xs text-gray-400">{Math.round(progress)}% færdig</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-0">
          {STEPS.map((s, i) => {
            const idx = i + 1
            const done = idx < step
            const active = idx === step
            return (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  done ? "bg-blue-600 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {done ? (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : idx}
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight ${active ? "text-blue-600" : done ? "text-blue-400" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-7">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-500 mb-7">{subtitle}</p>

        {children}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <div>
            {backHref ? (
              <Link
                href={backHref}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5"
              >
                ← Tilbage
              </Link>
            ) : (
              <div />
            )}
          </div>
          <button
            onClick={onNext}
            disabled={nextDisabled || saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Gemmer…" : nextLabel}
          </button>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <form action={completeOnboarding}>
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Spring onboarding over ›
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
