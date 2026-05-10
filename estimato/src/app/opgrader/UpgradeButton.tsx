"use client"

import { useState } from "react"

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
    >
      {loading ? "Forbereder betaling..." : "Start abonnement — 499 kr/md"}
    </button>
  )
}
