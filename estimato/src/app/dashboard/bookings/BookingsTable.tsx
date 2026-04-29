"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { BookingWithLead } from "./page"
import { updateBookingStatus } from "./actions"

const STATUS_LABEL: Record<string, string> = {
  pending: "Afventer",
  confirmed: "Bekræftet",
  cancelled: "Aflyst",
}
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-gray-100 text-gray-400",
}

interface Props {
  upcoming: BookingWithLead[]
  past: BookingWithLead[]
  counts: { all: number; pending: number; confirmed: number; cancelled: number }
  activeStatus: string
}

export default function BookingsTable({ upcoming, past, counts, activeStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const tabs = [
    { key: "all", label: "Alle", count: counts.all },
    { key: "pending", label: "Afventer", count: counts.pending },
    { key: "confirmed", label: "Bekræftede", count: counts.confirmed },
    { key: "cancelled", label: "Aflyste", count: counts.cancelled },
  ]

  function navigate(status: string) {
    router.push(`/dashboard/bookings${status === "all" ? "" : `?status=${status}`}`)
  }

  function handleStatusChange(bookingId: string, status: BookingWithLead["status"]) {
    startTransition(async () => {
      await updateBookingStatus(bookingId, status)
      router.refresh()
    })
  }

  const totalVisible = upcoming.length + past.length

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              activeStatus === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeStatus === tab.key ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-400"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tom tilstand */}
      {totalVisible === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
          <p className="text-gray-300 text-4xl mb-3">📅</p>
          <p className="text-sm text-gray-500 font-medium">Ingen bookinger</p>
          <p className="text-xs text-gray-400 mt-1">
            Bookinger oprettes når kunder vælger &quot;Book tid&quot; i widget&apos;en.
          </p>
        </div>
      )}

      {/* Kommende bookinger */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Kommende</p>
          <div className="flex flex-col gap-2">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} isPending={isPending} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}

      {/* Tidligere bookinger */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tidligere</p>
          <div className="flex flex-col gap-2 opacity-60">
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} isPending={isPending} onStatusChange={handleStatusChange} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function BookingCard({
  booking: b,
  isPending,
  onStatusChange,
}: {
  booking: BookingWithLead
  isPending: boolean
  onStatusChange: (id: string, status: BookingWithLead["status"]) => void
}) {
  const date = new Date(b.scheduled_at)
  const isToday = new Date().toDateString() === date.toDateString()
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString()

  const dayLabel = isToday
    ? "I dag"
    : isTomorrow
    ? "I morgen"
    : date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })

  const timeLabel = date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
      <div className="flex items-start gap-4">
        {/* Dato-boks */}
        <div className="shrink-0 w-14 text-center bg-gray-50 rounded-xl py-2 px-1 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase">
            {date.toLocaleDateString("da-DK", { month: "short" })}
          </p>
          <p className="text-xl font-bold leading-tight text-gray-800">{date.getDate()}</p>
          <p className="text-xs text-blue-600 font-semibold">{timeLabel}</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[b.status]}`}>
              {STATUS_LABEL[b.status]}
            </span>
            {isToday && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-600 text-white">
                I dag
              </span>
            )}
          </div>
          <p className="font-semibold text-sm text-gray-900">{b.lead.name}</p>
          <p className="text-xs text-gray-400 truncate">{b.lead.address}</p>

          <div className="flex items-center gap-3 mt-2">
            {b.lead.phone && (
              <a href={`tel:${b.lead.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 5.93 5.93l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
                </svg>
                {b.lead.phone}
              </a>
            )}
            {b.lead.email && (
              <a href={`mailto:${b.lead.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {b.lead.email}
              </a>
            )}
            <span className="text-xs text-gray-400 ml-auto font-semibold">
              {b.lead.price.toLocaleString("da-DK")} kr
            </span>
          </div>

        </div>
      </div>

      {/* Dag-label + status-knapper */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 capitalize">{dayLabel}</p>
        <div className="flex gap-2">
          {b.status !== "confirmed" && b.status !== "cancelled" && (
            <button
              disabled={isPending}
              onClick={() => onStatusChange(b.id, "confirmed")}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              Bekræft
            </button>
          )}
          {b.status !== "cancelled" && (
            <button
              disabled={isPending}
              onClick={() => onStatusChange(b.id, "cancelled")}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Aflys
            </button>
          )}
          {b.status === "cancelled" && (
            <button
              disabled={isPending}
              onClick={() => onStatusChange(b.id, "pending")}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Genåbn
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
