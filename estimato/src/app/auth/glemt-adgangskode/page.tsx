"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato.dk"

export default function GlemtAdgangskodePage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/auth/callback?next=/auth/nulstil-adgangskode`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">Estimato</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">Tjek din indbakke</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Hvis der findes en konto med den email, har vi sendt et nulstillingslink.
            </p>
            <Link href="/auth/login" className="text-sm text-blue-600 hover:underline font-medium">
              ← Tilbage til login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Glemt adgangskode?</h1>
            <p className="text-gray-500 text-sm mb-8">
              Indtast din email, så sender vi dig et link til at nulstille din adgangskode.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="din@email.dk"
                  className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-shadow"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
              >
                {loading ? "Sender..." : "Send nulstillingslink"}
              </button>
            </form>

            <p className="mt-6 text-sm text-center">
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-700">
                ← Tilbage til login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
