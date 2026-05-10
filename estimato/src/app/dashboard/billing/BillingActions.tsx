"use client"

import { useState } from "react"

export function PortalButton({ label = "Administrer abonnement →" }: { label?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
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
      className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
    >
      {loading ? "Åbner..." : label}
    </button>
  )
}

export function CheckoutButton() {
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
      className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
    >
      {loading ? "Forbereder betaling..." : "Start abonnement — 499 kr/md"}
    </button>
  )
}
