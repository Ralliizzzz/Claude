"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { LeadRow } from "@/types/database"
import type { LeadWithBooking } from "./page"
import { updateLeadStatus, deleteLead } from "./actions"

const STATUS_LABEL: Record<string, string> = {
  new: "Ny", contacted: "Kontaktet", booked: "Booket",
}
const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-50 text-blue-600",
  contacted: "bg-amber-50 text-amber-600",
  booked: "bg-emerald-50 text-emerald-600",
}
const ACTION_LABEL: Record<string, string> = {
  book: "Booking", callback: "Ring op", email: "Email",
}
const ACTION_STYLE: Record<string, string> = {
  book: "bg-violet-50 text-violet-600",
  callback: "bg-orange-50 text-orange-600",
  email: "bg-gray-100 text-gray-500",
}
const PROPERTY_LABEL: Record<string, string> = {
  house: "Villa / Hus", apartment: "Lejlighed", commercial: "Erhverv",
}

interface Props {
  leads: LeadWithBooking[]
  counts: { all: number; new: number; contacted: number; booked: number }
  activeStatus: string
}

export default function LeadsTable({ leads, counts, activeStatus }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tabs = [
    { key: "all", label: "Alle", count: counts.all },
    { key: "new", label: "Nye", count: counts.new },
    { key: "contacted", label: "Kontaktet", count: counts.contacted },
    { key: "booked", label: "Booket", count: counts.booked },
  ]

  function navigate(status: string) {
    router.push(`/dashboard/leads${status === "all" ? "" : `?status=${status}`}`)
  }

  function handleStatusChange(leadId: string, newStatus: string) {
    startTransition(async () => {
      await updateLeadStatus(leadId, newStatus as LeadRow["status"])
      router.refresh()
    })
  }

  function handleDelete(leadId: string) {
    if (!window.confirm("Er du sikker på at du vil slette dette lead? Det kan ikke fortrydes.")) return
    startTransition(async () => {
      await deleteLead(leadId)
      setExpandedId(null)
      router.refresh()
    })
  }

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
      {leads.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 text-center">
          <p className="text-gray-300 text-4xl mb-3">📭</p>
          <p className="text-sm text-gray-500 font-medium">Ingen leads</p>
          {activeStatus === "all" && (
            <p className="text-xs text-gray-400 mt-1">
              <Link href="/dashboard/embed" className="text-blue-600 hover:underline font-medium">
                Installer widget&apos;en
              </Link>{" "}
              for at begynde at modtage leads.
            </p>
          )}
        </div>
      )}

      {/* Leads */}
      {leads.length > 0 && (
        <div className="flex flex-col gap-2">
          {leads.map((lead) => {
            const booking = lead.bookings?.[0]
            const breakdown = lead.price_breakdown as Record<string, unknown> | null

            return (
              <div key={lead.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                {/* Hoved-række */}
                <div
                  className="flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[lead.status]}`}>
                        {STATUS_LABEL[lead.status]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLE[lead.action_type]}`}>
                        {ACTION_LABEL[lead.action_type]}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-400 truncate">{lead.address}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-gray-900">
                      {lead.price.toLocaleString("da-DK")} kr
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                    </p>
                  </div>

                  <svg
                    className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedId === lead.id ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Udvidet */}
                {expandedId === lead.id && (
                  <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/40">

                    {/* Kontaktinfo + boliginfo */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-4">
                      {lead.email && (
                        <Detail label="Email">
                          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                        </Detail>
                      )}
                      {lead.phone && (
                        <Detail label="Telefon">
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">{lead.phone}</a>
                        </Detail>
                      )}
                      {lead.sqm && <Detail label="Størrelse">{lead.sqm} m²</Detail>}
                      {lead.property_type && (
                        <Detail label="Ejendomstype">{PROPERTY_LABEL[lead.property_type] ?? lead.property_type}</Detail>
                      )}
                      {booking && (
                        <Detail label="Booket tidspunkt">
                          {new Date(booking.scheduled_at).toLocaleString("da-DK", {
                            weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                          })}
                        </Detail>
                      )}
                      <Detail label="Modtaget">
                        {new Date(lead.created_at).toLocaleString("da-DK", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </Detail>
                    </div>

                    {/* Logistik */}
                    {"logistics" in lead && lead.logistics && (() => {
                      const l = lead.logistics as { nearest_branch: string; distance_km: number; drive_minutes: number }
                      const h = Math.floor(l.drive_minutes / 60)
                      const m = l.drive_minutes % 60
                      const driveLabel = h > 0 ? `${h} t ${m > 0 ? `${m} min` : ""}`.trim() : `${m} min`
                      return (
                        <div className="mb-4 bg-white border border-gray-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Logistik</p>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                              </svg>
                              <span className="font-medium text-gray-700">{l.nearest_branch}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                              </svg>
                              <span>{l.distance_km} km</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              <span>{driveLabel} kørsel</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Prisspecifikation */}
                    {breakdown && (
                      <div className="mb-4 bg-white border border-gray-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prisspecifikation</p>
                        <div className="space-y-1">
                          <PriceLine label={`Grundpris${lead.sqm ? ` (${lead.sqm} m²)` : ""}`} value={`${Number(breakdown.base ?? 0).toLocaleString("da-DK")} kr`} />
                          {Array.isArray(breakdown.add_ons) && breakdown.add_ons.map((a: Record<string, unknown>, i: number) => (
                            <PriceLine key={i} label={String(a.name)} value={`+${Number(a.price).toLocaleString("da-DK")} kr`} />
                          ))}
                          {!!breakdown.transport_fee && (
                            <PriceLine
                              label="Kørsel"
                              value={`+${Number((breakdown.transport_fee as Record<string, unknown>).amount ?? 0).toLocaleString("da-DK")} kr`}
                            />
                          )}
                          {!!breakdown.discount && (
                            <PriceLine label={String((breakdown.discount as Record<string, unknown>).name)} value={`${Number((breakdown.discount as Record<string, unknown>).value ?? 0).toLocaleString("da-DK")} kr`} green />
                          )}
                          {!!breakdown.frequency_discount && (
                            <PriceLine label={String((breakdown.frequency_discount as Record<string, unknown>).name)} value={`${Number((breakdown.frequency_discount as Record<string, unknown>).value ?? 0).toLocaleString("da-DK")} kr`} green />
                          )}
                          <div className="pt-1 mt-1 border-t border-gray-100 flex justify-between">
                            <span className="text-xs font-bold text-gray-700">I alt inkl. moms</span>
                            <span className="text-sm font-bold text-gray-900">{lead.price.toLocaleString("da-DK")} kr</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Kommentarer — vises når notes-kolonnen er oprettet i DB */}
                    {"notes" in lead && lead.notes && (
                      <div className="mb-4 bg-white border border-gray-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Kommentarer</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{lead.notes as string}</p>
                      </div>
                    )}

                    {/* Status + slet */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                        <div className="flex gap-2">
                          {(["new", "contacted", "booked"] as const).map((s) => (
                            <button
                              key={s}
                              disabled={lead.status === s || isPending}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, s) }}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                                lead.status === s
                                  ? `${STATUS_STYLE[s]} border-current cursor-default`
                                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                              } disabled:opacity-50`}
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={isPending}
                        onClick={(e) => { e.stopPropagation(); handleDelete(lead.id) }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Slet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  )
}

function PriceLine({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${green ? "text-green-600" : "text-gray-500"}`}>{label}</span>
      <span className={`text-xs font-semibold ${green ? "text-green-600" : "text-gray-700"}`}>{value}</span>
    </div>
  )
}
