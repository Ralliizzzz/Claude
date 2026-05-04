"use client"

import { useEffect, useState } from "react"

interface Props {
  companyId: string
  sqm?: number
  onConfirm: (scheduledAt: string) => void
  onCancel: () => void
  isPending: boolean
}

export function BookingPicker({ companyId, sqm, onConfirm, onCancel, isPending }: Props) {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ mode: "dates" })
    if (sqm) params.set("sqm", String(sqm))
    fetch(`/api/widget/${companyId}/slots?${params}`)
      .then((r) => r.json())
      .then((d) => setDates(Array.isArray(d) ? d : []))
      .catch(() => setDates([]))
      .finally(() => setLoadingDates(false))
  }, [companyId, sqm])

  async function selectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlots([])
    setLoadingSlots(true)
    const params = new URLSearchParams({ date })
    if (sqm) params.set("sqm", String(sqm))
    const res = await fetch(`/api/widget/${companyId}/slots?${params}`)
    const data = await res.json()
    setSlots(Array.isArray(data) ? data : [])
    setLoadingSlots(false)
  }

  function formatDateLabel(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 86400000)
    if (d.toDateString() === today.toDateString()) return { top: "I dag", bottom: d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }) }
    if (d.toDateString() === tomorrow.toDateString()) return { top: "I morgen", bottom: d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }) }
    return {
      top: d.toLocaleDateString("da-DK", { weekday: "short" }),
      bottom: d.toLocaleDateString("da-DK", { day: "numeric", month: "short" }),
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-semibold text-blue-700 mb-3">Vælg dato og tidspunkt</p>

      {/* Datoer */}
      {loadingDates ? (
        <p className="text-xs text-gray-400 mb-3">Henter ledige datoer…</p>
      ) : dates.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3">Ingen ledige tider — tjek åbningstider i indstillinger.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {dates.map((d) => {
            const { top, bottom } = formatDateLabel(d)
            const isSelected = selectedDate === d
            return (
              <button
                key={d}
                onClick={() => selectDate(d)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs font-medium transition-colors min-w-[52px] ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-500"}`}>{top}</span>
                <span>{bottom}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Tidspunkter */}
      {selectedDate && (
        <>
          {loadingSlots ? (
            <p className="text-xs text-gray-400 mb-3">Henter ledige tider…</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-gray-400 mb-3">Ingen ledige tider denne dag.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Handlinger */}
      <div className="flex items-center gap-2">
        <button
          disabled={!selectedSlot || isPending}
          onClick={() => selectedSlot && onConfirm(selectedSlot)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Gemmer…" : "Bekræft booking"}
        </button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        >
          Annuller
        </button>
      </div>
    </div>
  )
}
