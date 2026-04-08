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
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
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
      {/* Filter-tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative -mb-px border border-b-0 ${
              activeStatus === tab.key
                ? "border-gray-200 bg-white text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeStatus === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tom tilstand */}
      {totalVisible === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">Ingen bookinger endnu.</p>
          <p className="text-xs mt-1">
            Bookinger oprettes når kunder vælger &quot;Book tid&quot; i widget&apos;en.
          </p>
        </div>
      )}

      {/* Kommende bookinger */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Kommende
          </h2>
          <div className="flex flex-col gap-2">
            {upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                isPending={isPending}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tidligere bookinger */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Tidligere
          </h2>
          <div className="flex flex-col gap-2 opacity-70">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                isPending={isPending}
                onStatusChange={handleStatusChange}
              />
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
  const isTomorrow =
    new Date(Date.now() + 86400000).toDateString() === date.toDateString()

  const dayLabel = isToday
    ? "I dag"
    : isTomorrow
    ? "I morgen"
    : date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })

  const timeLabel = date.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Dato-boks */}
        <div className="shrink-0 w-14 text-center bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
          <p className="text-xs text-gray-400 font-medium uppercase">
            {date.toLocaleDateString("da-DK", { month: "short" })}
          </p>
          <p className="text-xl font-bold leading-tight text-gray-800">
            {date.getDate()}
          </p>
          <p className="text-xs text-blue-500 font-semibold">{timeLabel}</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[b.status]}`}>
              {STATUS_LABEL[b.status]}
            </span>
            {isToday && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500 text-white">
                I dag
              </span>
            )}
          </div>
          <p className="font-medium text-sm">{b.lead.name}</p>
          <p className="text-xs text-gray-400 truncate">{b.lead.address}</p>

          <div className="flex items-center gap-3 mt-2">
            {b.lead.phone && (
              <a
                href={`tel:${b.lead.phone}`}
                className="text-xs text-blue-500 hover:underline"
              >
                📞 {b.lead.phone}
              </a>
            )}
            {b.lead.email && (
              <a
                href={`mailto:${b.lead.email}`}
                className="text-xs text-blue-500 hover:underline"
              >
                ✉️ {b.lead.email}
              </a>
            )}
            <span className="text-xs text-gray-400 ml-auto">
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
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              Bekræft
            </button>
          )}
          {b.status !== "cancelled" && (
            <button
              disabled={isPending}
              onClick={() => onStatusChange(b.id, "cancelled")}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Aflys
            </button>
          )}
          {b.status === "cancelled" && (
            <button
              disabled={isPending}
              onClick={() => onStatusChange(b.id, "pending")}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Genåbn
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
