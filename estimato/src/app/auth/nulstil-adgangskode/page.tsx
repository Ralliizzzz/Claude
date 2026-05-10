"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: "Mindst 8 tegn", ok: password.length >= 8 },
    { label: "Mindst ét stort bogstav", ok: /[A-Z]/.test(password) },
    { label: "Mindst ét tal", ok: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <ul className="flex flex-col gap-1 mt-1.5">
      {checks.map(({ label, ok }) => (
        <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-gray-400"}`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {ok ? <polyline points="20 6 9 17 4 12" /> : <line x1="18" y1="6" x2="6" y2="18" />}
          </svg>
          {label}
        </li>
      ))}
    </ul>
  )
}

function isPasswordValid(p: string) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)
}

export default function NulstilAdgangskodePage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Adgangskoderne matcher ikke")
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/dashboard")
  }

  const valid = isPasswordValid(password)

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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ny adgangskode</h1>
        <p className="text-gray-500 text-sm mb-8">Vælg en ny adgangskode til din konto.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Ny adgangskode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-shadow"
            />
            <PasswordRequirements password={password} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Bekræft adgangskode</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-shadow"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !valid}
            className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm mt-1"
          >
            {loading ? "Gemmer..." : "Gem ny adgangskode"}
          </button>
        </form>
      </div>
    </div>
  )
}
