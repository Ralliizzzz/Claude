"use client"

import { useState } from "react"

export function PortalButton({ label = "Administrer abonnement →" }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Kunne ikke åbne portal")
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Åbner..." : label}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? "Kunne ikke starte betaling")
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
      >
        {loading ? "Forbereder betaling..." : "Start abonnement — 499 kr/md"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
