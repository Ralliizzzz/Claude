"use client"

import { useEffect, useState } from "react"

interface Props {
  companyId: string
  sqm?: number
  onConfirm: (scheduledAt: string) => void
  onCancel: () => void
  isPending: boolean
}

const DAY_NAMES = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]
const MONTH_NAMES = ["Januar", "Februar", "Marts", "April", "Maj", "Juni", "Juli", "August", "September", "Oktober", "November", "December"]

export function BookingPicker({ companyId, sqm, onConfirm, onCancel, isPending }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [loadingDates, setLoadingDates] = useState(true)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ mode: "dates" })
    if (sqm) params.set("sqm", String(sqm))
    fetch(`/api/widget/${companyId}/slots?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setAvailableDates(new Set(d.map((iso: string) => iso.slice(0, 10))))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDates(false))
  }, [companyId, sqm])

  async function selectDate(dateStr: string) {
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setSlots([])
    setLoadingSlots(true)
    const params = new URLSearchParams({ date: dateStr })
    if (sqm) params.set("sqm", String(sqm))
    const res = await fetch(`/api/widget/${companyId}/slots?${params}`)
    const data = await res.json()
    setSlots(Array.isArray(data) ? data : [])
    setLoadingSlots(false)
  }

  // Byg kalender-grid for den viste måned
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  // Mandag = 0, ..., Søndag = 6
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ]
  // Pad til fuld uge
  while (cells.length % 7 !== 0) cells.push(null)

  function canGoBack() {
    return viewYear > today.getFullYear() || viewMonth > today.getMonth()
  }

  function prevMonth() {
    if (!canGoBack()) return
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-semibold text-blue-700 mb-3">Vælg dato og tidspunkt</p>

      {/* Kalender */}
      <div className="bg-white border border-gray-100 rounded-lg p-3 mb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            disabled={!canGoBack()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Ugedage */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Dage */}
        {loadingDates ? (
          <p className="text-center text-xs text-gray-400 py-4">Henter ledige dage…</p>
        ) : (
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const cellDate = new Date(viewYear, viewMonth, day)
              const isPast = cellDate < today
              const isAvailable = availableDates.has(dateStr)
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={i}
                  disabled={isPast || !isAvailable}
                  onClick={() => selectDate(dateStr)}
                  className={`h-8 w-full rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : isAvailable
                      ? "text-gray-900 hover:bg-blue-50 hover:text-blue-700"
                      : "text-gray-300 cursor-default"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tidspunkter */}
      {selectedDate && (
        <div className="mb-3">
          {loadingSlots ? (
            <p className="text-xs text-gray-400">Henter ledige tider…</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-gray-400">Ingen ledige tider denne dag.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    selectedSlot === slot
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
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
