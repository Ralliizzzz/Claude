"use client"

import { useState, useEffect } from "react"

const c = {
  blue: "#2563eb",
  blueLight: "#eff6ff",
  blueBorder: "#bfdbfe",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray700: "#374151",
  gray900: "#111827",
  green: "#16a34a",
  greenLight: "#f0fdf4",
}

const PROPERTY_LABELS: Record<string, string> = {
  house: "Villa / Hus",
  apartment: "Lejlighed",
  commercial: "Erhverv",
}

const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"]
const DAY_SHORT = ["Ma","Ti","On","To","Fr","Lø","Sø"]

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

interface PriceBreakdown {
  base: number
  add_ons: { name: string; price: number }[]
  discount: { name: string; value: number } | null
  frequency_discount: { name: string; value: number } | null
  transport_fee: { amount: number; billable_km: number; price_per_km: number } | null
  total: number
}

interface Props {
  leadId: string
  companyId: string
  companyName: string
  companyEmail: string
  companyPhone: string | null
  customerName: string
  address: string
  sqm: number | null
  propertyType: string | null
  price: number
  priceBreakdown: Record<string, unknown> | null
  alreadyBooked: boolean
}

function Calendar({ availableDates, selectedDate, onSelect }: {
  availableDates: string[]
  selectedDate: string | null
  onSelect: (d: string) => void
}) {
  const today = new Date()
  const todayStr = toDateStr(today)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const available = new Set(availableDates)
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ border: `1.5px solid ${c.gray200}`, borderRadius: 12, padding: 8, background: "#fff", width: 256, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${c.gray200}`, borderRadius: 5, width: 24, height: 24, cursor: "pointer", fontSize: "0.9rem", color: c.gray500, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: "0.78rem", color: c.gray900 }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${c.gray200}`, borderRadius: 5, width: 24, height: 24, cursor: "pointer", fontSize: "0.9rem", color: c.gray500, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
        {DAY_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: "0.58rem", fontWeight: 700, color: c.gray400, textTransform: "uppercase" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const dateStr = toDateStr(new Date(viewYear, viewMonth, day))
          const isPast = dateStr < todayStr
          const isAvail = available.has(dateStr)
          const isSel = selectedDate === dateStr
          const isToday = dateStr === todayStr
          return (
            <button
              key={dateStr}
              disabled={isPast || !isAvail}
              onClick={() => { if (!isPast && isAvail) onSelect(dateStr) }}
              style={{
                height: 31, border: `1.5px solid ${isSel ? c.blue : isToday && !isSel ? c.blue : "transparent"}`,
                borderRadius: 5, cursor: isPast || !isAvail ? "default" : "pointer",
                background: isSel ? c.blue : isAvail && !isPast ? c.blueLight : "transparent",
                color: isSel ? "#fff" : isPast || !isAvail ? c.gray300 : c.gray900,
                fontSize: "0.72rem", fontWeight: isToday || isSel ? 700 : 400, padding: 0,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function QuoteBooking({
  leadId, companyId, companyName, companyEmail, companyPhone,
  customerName, address, sqm, propertyType, price, priceBreakdown, alreadyBooked,
}: Props) {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slotsForDate, setSlotsForDate] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingDates, setLoadingDates] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [booked, setBooked] = useState(alreadyBooked)

  const firstName = customerName.split(" ")[0]
  const bd = priceBreakdown as PriceBreakdown | null
  const savings = Math.abs((bd?.discount?.value ?? 0) + (bd?.frequency_discount?.value ?? 0))

  useEffect(() => {
    fetch(`/api/widget/${companyId}/slots?mode=dates`)
      .then(r => r.ok ? r.json() : [])
      .then(setAvailableDates)
      .finally(() => setLoadingDates(false))
  }, [companyId])

  async function onSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlotsForDate([])
    setLoadingSlots(true)
    const res = await fetch(`/api/widget/${companyId}/slots?date=${date}`)
    setSlotsForDate(res.ok ? await res.json() : [])
    setLoadingSlots(false)
  }

  async function handleBook() {
    if (!selectedSlot) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/quote/${leadId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: selectedSlot }),
      })
      if (!res.ok) throw new Error("fejl")
      setBooked(true)
    } catch {
      setSubmitError("Noget gik galt. Prøv igen eller kontakt os direkte.")
    } finally {
      setSubmitting(false)
    }
  }

  if (booked) {
    return (
      <div style={{ maxWidth: 560, width: "100%", background: "#fff", border: `1px solid ${c.gray200}`, borderRadius: 20, padding: 40, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: c.greenLight, border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: c.gray900, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Booking modtaget!</h1>
          <p style={{ color: c.gray500, fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 340, margin: "0 auto" }}>
            Tak, {firstName}! Vi har modtaget din bookingforespørgsel og vender tilbage hurtigst muligt med en bekræftelse.
          </p>
          {companyPhone && (
            <p style={{ marginTop: 20, color: c.gray500, fontSize: "0.85rem" }}>
              Spørgsmål? Ring til os på <a href={`tel:${companyPhone}`} style={{ color: c.blue, fontWeight: 600 }}>{companyPhone}</a>
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, width: "100%", background: "#fff", border: `1px solid ${c.gray200}`, borderRadius: 20, padding: 40, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${c.gray100}` }}>
        <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, color: c.gray400, textTransform: "uppercase", letterSpacing: "0.07em" }}>{companyName}</p>
        <h1 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: 800, color: c.gray900, letterSpacing: "-0.02em" }}>
          Dit tilbud, {firstName}
        </h1>
        <p style={{ margin: 0, fontSize: "0.87rem", color: c.gray500 }}>{address}</p>
      </div>

      {/* Prisoversigt */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 12px", fontSize: "0.7rem", fontWeight: 700, color: c.gray400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Prisoversigt</p>
        <div style={{ border: `1.5px solid ${c.gray200}`, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
          {bd ? (
            <>
              <PriceLine label={`Grundpris${sqm ? ` (${sqm} m²)` : ""}`} value={`${bd.base.toLocaleString("da-DK")} kr`} />
              {bd.add_ons.map((a, i) => <PriceLine key={i} label={a.name} value={`+${a.price.toLocaleString("da-DK")} kr`} />)}
              {bd.transport_fee && <PriceLine label={`Kørsel (${bd.transport_fee.billable_km} km × ${bd.transport_fee.price_per_km} kr/km)`} value={`+${bd.transport_fee.amount.toLocaleString("da-DK")} kr`} />}
              {bd.discount && <PriceLine label={bd.discount.name} value={`${bd.discount.value.toLocaleString("da-DK")} kr`} green />}
              {bd.frequency_discount && <PriceLine label={`Hyppighedsrabat (${bd.frequency_discount.name})`} value={`${bd.frequency_discount.value.toLocaleString("da-DK")} kr`} green />}
            </>
          ) : null}
          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", background: c.gray50 }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: c.gray400, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>I alt inkl. moms</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: c.blue, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {price.toLocaleString("da-DK")} <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>kr</span>
              </div>
            </div>
            {savings > 0 && (
              <div style={{ textAlign: "right", background: c.greenLight, border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 12px" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: c.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>Du sparer</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: c.green }}>{savings.toLocaleString("da-DK")} kr</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          {sqm && <Chip>{sqm} m²</Chip>}
          {propertyType && <Chip>{PROPERTY_LABELS[propertyType] ?? propertyType}</Chip>}
        </div>
      </div>

      {/* Kalender-sektion */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 16px", fontSize: "0.7rem", fontWeight: 700, color: c.gray400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Book en tid</p>
        {loadingDates ? (
          <p style={{ color: c.gray400, fontSize: "0.83rem" }}>Henter ledige tider…</p>
        ) : availableDates.length === 0 ? (
          <div style={{ padding: "12px 16px", background: c.gray50, border: `1px solid ${c.gray200}`, borderRadius: 10, fontSize: "0.85rem", color: c.gray500 }}>
            Ingen ledige tider de næste 30 dage — kontakt os direkte for at aftale en tid.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" as const }}>
            <Calendar availableDates={availableDates} selectedDate={selectedDate} onSelect={onSelectDate} />
            {selectedDate && (
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 700, color: c.gray400, textTransform: "uppercase", letterSpacing: "0.08em" }}>Vælg tidspunkt</p>
                {loadingSlots ? (
                  <p style={{ color: c.gray400, fontSize: "0.83rem" }}>Henter tider…</p>
                ) : slotsForDate.length === 0 ? (
                  <div style={{ padding: "10px 12px", background: c.gray50, border: `1px solid ${c.gray200}`, borderRadius: 10, fontSize: "0.82rem", color: c.gray500 }}>
                    Ingen ledige tider denne dag.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {slotsForDate.map(slot => {
                      const d = new Date(slot)
                      const startH = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                      const endH = new Date(d.getTime() + 7200000).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                      const sel = selectedSlot === slot
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(sel ? null : slot)}
                          style={{ border: `1.5px solid ${sel ? c.blue : c.gray200}`, background: sel ? c.blueLight : "#fff", borderRadius: 8, padding: "7px 10px", fontSize: "0.8rem", cursor: "pointer", color: sel ? c.blue : c.gray700, fontWeight: sel ? 700 : 500, whiteSpace: "nowrap" }}
                        >
                          {startH} – {endH}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <div style={{ color: "#dc2626", fontSize: "0.85rem", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 12 }}>
          {submitError}
        </div>
      )}

      {/* Book-knap */}
      <button
        disabled={!selectedSlot || submitting}
        onClick={handleBook}
        style={{ width: "100%", background: !selectedSlot || submitting ? c.gray200 : c.blue, color: !selectedSlot || submitting ? c.gray400 : "#fff", border: "none", borderRadius: 12, padding: "15px 24px", fontSize: "0.95rem", fontWeight: 700, cursor: !selectedSlot || submitting ? "not-allowed" : "pointer", marginBottom: 10, letterSpacing: "0.01em" }}
      >
        {submitting ? "Booker…" : "Accepter tilbud & book tid"}
      </button>

      {/* Kontakt */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        {companyPhone && (
          <a href={`tel:${companyPhone}`} style={{ flex: 1, minWidth: 140, display: "block", textAlign: "center", background: c.gray900, color: "#fff", textDecoration: "none", padding: "13px 16px", borderRadius: 12, fontWeight: 600, fontSize: "0.88rem" }}>
            Ring til os
          </a>
        )}
        {companyEmail && (
          <a href={`mailto:${companyEmail}`} style={{ flex: 1, minWidth: 140, display: "block", textAlign: "center", background: "#fff", color: c.gray700, textDecoration: "none", padding: "13px 16px", borderRadius: 12, fontWeight: 600, fontSize: "0.88rem", border: `1px solid ${c.gray200}` }}>
            Skriv til os
          </a>
        )}
      </div>

      <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.75rem", color: c.gray400 }}>
        Leveret via Estimato
      </p>
    </div>
  )
}

function PriceLine({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 18px", borderBottom: `1px solid ${c.gray100}` }}>
      <span style={{ fontSize: "0.85rem", color: green ? c.green : c.gray700 }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: green ? c.green : c.gray900 }}>{value}</span>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.75rem", color: c.gray500, background: c.gray50, border: `1px solid ${c.gray200}`, borderRadius: 6, padding: "3px 8px" }}>
      {children}
    </span>
  )
}
