"use client"

import { useState } from "react"

export default function UpgradeButton() {
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
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
      >
        {loading ? "Forbereder betaling..." : "Start abonnement — 499 kr/md"}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
