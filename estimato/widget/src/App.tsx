import { h, Fragment } from "preact"
import type { ComponentChildren } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import type { QuoteSettings, PropertyType, ActionType, Step, PriceBreakdown, FrequencyKey } from "./types"
import { fetchSettings, fetchAddressSuggestions, fetchBBRData, fetchAvailableDates, fetchSlotsForDate, submitLead } from "./api"
import { calculatePrice } from "./calc"

// ─── Design tokens ─────────────────────────────────────────────────────────
const c = {
  blue: "#2563eb",
  blueLight: "#eff6ff",
  blueBorder: "#93c5fd",
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
  red: "#dc2626",
  redLight: "#fef2f2",
  redBorder: "#fecaca",
}

const font = "Inter,'Segoe UI',system-ui,sans-serif"

const s = {
  wrap: `font-family:${font};max-width:780px;width:100%;background:#fff;border:1px solid ${c.gray200};border-radius:20px;padding:32px;box-sizing:border-box;color:${c.gray900};box-shadow:0 2px 8px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.04);margin:0 auto;`,
  label: `display:block;font-size:0.7rem;font-weight:700;color:${c.gray400};margin-bottom:8px;text-transform:uppercase;letter-spacing:0.07em;`,
  input: `width:100%;border:1.5px solid ${c.gray200};border-radius:12px;padding:13px 16px;font-size:0.93rem;box-sizing:border-box;outline:none;font-family:${font};color:${c.gray900};background:#fff;transition:border-color 0.15s;`,
  btn: `width:100%;background:${c.blue};color:#fff;border:none;border-radius:12px;padding:15px 24px;font-size:0.95rem;font-weight:700;cursor:pointer;margin-top:18px;font-family:${font};letter-spacing:0.01em;`,
  btnDisabled: "opacity:0.4;cursor:not-allowed;",
  btnBack: `background:none;border:none;color:${c.gray400};font-size:0.82rem;cursor:pointer;padding:0;margin-bottom:24px;font-family:${font};display:flex;align-items:center;gap:5px;`,
  hint: `font-size:0.78rem;color:${c.gray400};margin-top:6px;`,
  error: `color:${c.red};font-size:0.85rem;padding:12px 16px;background:${c.redLight};border:1px solid ${c.redBorder};border-radius:10px;margin-top:10px;`,
  h2: `font-size:1.4rem;font-weight:800;margin:0 0 5px;color:${c.gray900};letter-spacing:-0.02em;`,
  subtitle: `font-size:0.87rem;color:${c.gray500};margin:0 0 20px;line-height:1.5;`,
  section: "margin-bottom:28px;",
  sectionLabel: `font-size:0.7rem;font-weight:700;color:${c.gray400};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;`,
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const PROPERTY_LABELS: Record<PropertyType, string> = {
  house: "Villa / Hus",
  apartment: "Lejlighed",
  commercial: "Erhverv",
}

const FREQUENCY_LABELS: Record<FrequencyKey, string> = {
  weekly: "Ugentlig",
  every2weeks: "Hver 2. uge",
  every3weeks: "Hver 3. uge",
  every4weeks: "Hver 4. uge",
}

const STEP_NUM: Record<Step, number> = {
  address: 1, price: 2, action: 3, contact: 4, confirmation: 4,
}

// ─── Sub-components ────────────────────────────────────────────────────────

const STEP_LABELS = ["Adresse", "Pris", "Handling", "Kontakt"]

function Progress({ step }: { step: Step }) {
  const n = STEP_NUM[step]
  const done = step === "confirmation"
  return (
    <div style={`margin-bottom:32px;padding-bottom:28px;border-bottom:1px solid ${c.gray100};`}>
      <div style="display:flex;gap:0;margin-bottom:8px;">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style="flex:1;display:flex;align-items:center;">
            <div style={`flex:1;height:3px;border-radius:2px;background:${done || i <= n ? c.blue : c.gray200};transition:background 0.25s;`} />
          </div>
        ))}
      </div>
      <div style="display:flex;">
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1
          const active = idx === n && !done
          const completed = done || idx < n
          return (
            <div key={label} style="flex:1;display:flex;flex-direction:column;align-items:center;">
              <div style={`width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;margin-bottom:4px;${
                completed ? `background:${c.blue};color:#fff;` : active ? `background:${c.blue};color:#fff;` : `background:${c.gray100};color:${c.gray400};`
              }`}>
                {completed && idx < n ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : String(idx)}
              </div>
              <span style={`font-size:0.67rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${active || completed ? c.blue : c.gray400};`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button style={s.btnBack} onClick={onClick}>← Tilbage</button>
  )
}

// Selectable card — works for both multi-select (add-ons) and single-select (frequency/discount)
interface SelectCardProps {
  selected: boolean
  onClick: () => void
  title: string
  subtitle?: string
  badge?: string
}

function SelectCard({ selected, onClick, title, subtitle, badge }: SelectCardProps) {
  return (
    <div
      onClick={onClick}
      style={`position:relative;border:2px solid ${selected ? c.blue : c.gray200};background:${selected ? c.blueLight : "#fff"};border-radius:14px;padding:14px 16px;cursor:pointer;transition:border-color 0.15s,background 0.15s;box-shadow:${selected ? `0 0 0 1px ${c.blue}20` : "none"};`}
    >
      {selected && (
        <div style={`position:absolute;top:-9px;right:-9px;width:20px;height:20px;border-radius:50%;background:${c.blue};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(37,99,235,0.4);`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <div style={`font-weight:600;font-size:0.87rem;color:${selected ? c.blue : c.gray900};margin-bottom:${subtitle || badge ? "3px" : "0"};`}>{title}</div>
      {subtitle && (
        <div style={`font-size:0.76rem;color:${selected ? c.blue : c.gray500};`}>{subtitle}</div>
      )}
      {badge && (
        <div style={`margin-top:6px;font-size:0.8rem;font-weight:700;color:${selected ? c.blue : c.green};`}>{badge}</div>
      )}
    </div>
  )
}

// Price summary card with live updates
function PriceSummary({ breakdown, sqm }: { breakdown: PriceBreakdown; sqm: string }) {
  const savings = Math.abs((breakdown.discount?.value ?? 0) + (breakdown.frequency_discount?.value ?? 0))
  return (
    <div style={`background:${c.gray50};border:1.5px solid ${c.gray200};border-radius:16px;padding:20px 22px;`}>
      <p style={s.sectionLabel}>Din prisberegning</p>

      <div>
        <PriceLine label={`Grundpris (${sqm} m²)`} value={`${breakdown.base.toLocaleString("da-DK")} kr`} />
        {breakdown.add_ons.map((a) => (
          <PriceLine key={a.name} label={a.name} value={`+${a.price.toLocaleString("da-DK")} kr`} />
        ))}
        {breakdown.transport_fee && (
          <PriceLine
            label={`Kørsel (${breakdown.transport_fee.billable_km} km × ${breakdown.transport_fee.price_per_km} kr/km)`}
            value={`+${breakdown.transport_fee.amount.toLocaleString("da-DK")} kr`}
          />
        )}
        {breakdown.discount && (
          <PriceLine label={breakdown.discount.name} value={`${breakdown.discount.value.toLocaleString("da-DK")} kr`} green />
        )}
        {breakdown.frequency_discount && (
          <PriceLine
            label={`Hyppighedsrabat (${breakdown.frequency_discount.name})`}
            value={`${breakdown.frequency_discount.value.toLocaleString("da-DK")} kr`}
            green
          />
        )}
      </div>

      <div style={`height:1px;background:${c.gray300};margin:16px 0;`} />

      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style={`font-size:0.7rem;font-weight:700;color:${c.gray400};text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;`}>I alt inkl. moms</div>
          <div style={`font-size:2.1rem;font-weight:800;color:${c.blue};letter-spacing:-0.03em;line-height:1;`}>
            {breakdown.total.toLocaleString("da-DK")} <span style="font-size:1.1rem;font-weight:700;">kr</span>
          </div>
        </div>
        {savings > 0 && (
          <div style={`text-align:right;background:${c.greenLight};border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px;`}>
            <div style={`font-size:0.7rem;font-weight:700;color:${c.green};text-transform:uppercase;letter-spacing:0.06em;`}>Du sparer</div>
            <div style={`font-size:1.05rem;font-weight:800;color:${c.green};`}>{savings.toLocaleString("da-DK")} kr</div>
          </div>
        )}
      </div>
    </div>
  )
}

function PriceLine({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div style={`display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ${c.gray100};`}>
      <span style={`font-size:0.85rem;color:${green ? c.green : c.gray700};`}>{label}</span>
      <span style={`font-size:0.85rem;font-weight:600;color:${green ? c.green : c.gray900};`}>{value}</span>
    </div>
  )
}

function BbrChip({ children }: { children: ComponentChildren }) {
  return (
    <span style={`display:inline-flex;align-items:center;font-size:0.75rem;color:${c.gray500};background:${c.gray50};border:1px solid ${c.gray200};border-radius:6px;padding:3px 8px;`}>
      {children}
    </span>
  )
}

// ─── Calendar helpers ──────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"]
const DAY_SHORT = ["Ma","Ti","On","To","Fr","Lø","Sø"]

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
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={`border:1.5px solid ${c.gray200};border-radius:12px;padding:8px;background:#fff;width:256px;box-sizing:border-box;`}>
      {/* Måned-navigation */}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <button
          onClick={prevMonth}
          style={`background:none;border:1px solid ${c.gray200};border-radius:5px;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${c.gray500};font-family:${font};font-size:0.9rem;line-height:1;flex-shrink:0;`}
        >‹</button>
        <span style={`font-weight:700;font-size:0.78rem;color:${c.gray900};`}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button
          onClick={nextMonth}
          style={`background:none;border:1px solid ${c.gray200};border-radius:5px;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:${c.gray500};font-family:${font};font-size:0.9rem;line-height:1;flex-shrink:0;`}
        >›</button>
      </div>

      {/* Ugedage */}
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px;">
        {DAY_SHORT.map((d) => (
          <div key={d} style={`text-align:center;font-size:0.58rem;font-weight:700;color:${c.gray400};text-transform:uppercase;padding:1px 0;`}>{d}</div>
        ))}
      </div>

      {/* Dage */}
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
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
              style={`
                height:31px;border:1.5px solid ${isSel ? c.blue : isToday && !isSel ? c.blue : "transparent"};
                border-radius:5px;cursor:${isPast || !isAvail ? "default" : "pointer"};
                background:${isSel ? c.blue : isAvail && !isPast ? c.blueLight : "transparent"};
                color:${isSel ? "#fff" : isPast || !isAvail ? c.gray300 : c.gray900};
                font-size:0.72rem;font-weight:${isToday || isSel ? "700" : "400"};
                font-family:${font};padding:0;transition:background 0.1s,border-color 0.1s;
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────

interface AppProps {
  companyId: string
}

export default function App({ companyId }: AppProps) {
  const [step, setStep] = useState<Step>("address")
  const [settings, setSettings] = useState<QuoteSettings | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Address
  const [addressText, setAddressText] = useState("")
  const [addressId, setAddressId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<{ text: string; id: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [propertyType, setPropertyType] = useState<PropertyType>("house")
  const [sqm, setSqm] = useState<string>("")
  const [bbrLoading, setBbrLoading] = useState(false)
  const [customerLat, setCustomerLat] = useState<number | null>(null)
  const [customerLon, setCustomerLon] = useState<number | null>(null)
  const [nearestDistanceKm, setNearestDistanceKm] = useState<number | null>(null)
  const [outOfRange, setOutOfRange] = useState(false)
  const [bbrRooms, setBbrRooms] = useState<number | null>(null)
  const [bbrToilets, setBbrToilets] = useState<number | null>(null)
  const [bbrBathrooms, setBbrBathrooms] = useState<number | null>(null)
  const [bbrFloors, setBbrFloors] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Price
  const [autoAddOns, setAutoAddOns] = useState<string[]>([])
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null)
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyKey | null>(null)
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null)

  // Action
  const [action, setAction] = useState<ActionType | null>(null)

  // Booking — kalender og tider
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slotsForDate, setSlotsForDate] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingDates, setLoadingDates] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Contact
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings(companyId).then(setSettings).catch(() => setLoadError(true))
  }, [companyId])

  function onAddressInput(val: string) {
    setAddressText(val)
    setAddressId(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetchAddressSuggestions(val)
      setSuggestions(res)
      setShowSuggestions(res.length > 0)
    }, 300)
  }

  async function onSelectSuggestion(sg: { text: string; id: string }) {
    setAddressText(sg.text)
    setAddressId(sg.id)
    setSuggestions([])
    setShowSuggestions(false)
    setBbrLoading(true)
    try {
      const bbr = await fetchBBRData(sg.id)
      if (bbr.sqm) setSqm(String(Math.round(bbr.sqm)))
      if (bbr.propertyType) setPropertyType(bbr.propertyType as PropertyType)
      setBbrRooms(bbr.rooms)
      setBbrToilets(bbr.toilets)
      setBbrBathrooms(bbr.bathrooms)
      setBbrFloors(bbr.floors)
      setCustomerLat(bbr.lat)
      setCustomerLon(bbr.lon)

      if (settings?.locations && settings.locations.length > 0) {
        if (!bbr.lat || !bbr.lon) {
          setOutOfRange(true)
          setNearestDistanceKm(null)
        } else {
          const distances = settings.locations.map(
            (loc) => ({ loc, km: haversineKm(bbr.lat!, bbr.lon!, loc.lat, loc.lon) })
          )
          const nearest = distances.reduce((a, b) => a.km < b.km ? a : b)
          setNearestDistanceKm(nearest.km)
          setOutOfRange(nearest.loc.max_distance_km > 0 && nearest.km > nearest.loc.max_distance_km)
        }
      } else {
        if (bbr.lat && bbr.lon && settings?.locations?.length === 0) setNearestDistanceKm(null)
        setOutOfRange(false)
      }
    } catch { /* ignore */ } finally {
      setBbrLoading(false)
    }
  }

  // Auto-select BBR-derived add-ons whenever floors/bathrooms/propertyType changes
  useEffect(() => {
    if (!settings) return
    const hasAddon = (id: string) => settings.add_ons.some((a) => a.id === id)
    const auto: string[] = []
    if (bbrFloors != null && bbrFloors > 1) {
      if (propertyType === "apartment" && hasAddon("addon_extra_floor_apt")) auto.push("addon_extra_floor_apt")
      if (propertyType === "house"     && hasAddon("addon_extra_floor_house")) auto.push("addon_extra_floor_house")
    }
    if (bbrBathrooms != null && bbrBathrooms > 1 && hasAddon("addon_extra_bathroom")) {
      auto.push("addon_extra_bathroom")
    }
    setAutoAddOns(auto)
  }, [bbrFloors, bbrBathrooms, propertyType, settings])

  function goToPrice() {
    if (!settings || !sqm || Number(sqm) <= 0 || outOfRange) return
    const allAddOns = [...autoAddOns, ...(hasPets ? ["addon_pets"] : []), ...selectedAddOns]
    const bd = calculatePrice(Number(sqm), settings, allAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm)
    setBreakdown(bd)
    setStep("price")
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  useEffect(() => {
    if (!settings || !sqm) return
    const allAddOns = [...autoAddOns, ...(hasPets ? ["addon_pets"] : []), ...selectedAddOns]
    const bd = calculatePrice(Number(sqm), settings, allAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm)
    setBreakdown(bd)
  }, [autoAddOns, hasPets, selectedAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm, settings, sqm])

  async function goToContact(chosenAction: ActionType) {
    setAction(chosenAction)
    if (chosenAction === "book") {
      setLoadingDates(true)
      setAvailableDates([])
      setSelectedDate(null)
      setSlotsForDate([])
      setSelectedSlot(null)
      const dates = await fetchAvailableDates(companyId)
      setAvailableDates(dates)
      setLoadingDates(false)
    }
    setStep("contact")
  }

  async function onSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlotsForDate([])
    setLoadingSlots(true)
    const slots = await fetchSlotsForDate(companyId, date)
    setSlotsForDate(slots)
    setLoadingSlots(false)
  }

  async function handleSubmit() {
    if (!breakdown || !action) return
    if (action === "book" && !selectedSlot) return
    if (action !== "callback" && !email) return
    if (!phone) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitLead(companyId, {
        name, email: email || undefined, phone,
        address: addressText,
        sqm: Number(sqm) || undefined,
        property_type: propertyType,
        price: breakdown.total,
        price_breakdown: breakdown,
        action_type: action,
        scheduled_at: selectedSlot ?? undefined,
        notes: notes || undefined,
      })
      setStep("confirmation")
    } catch {
      setSubmitError("Noget gik galt. Prøv igen.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div style={s.wrap}>
        <p style={`color:${c.red};font-size:0.9rem;`}>Kunne ikke indlæse widget. Prøv igen.</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div style={s.wrap}>
        <div style={`display:flex;align-items:center;gap:10px;color:${c.gray400};font-size:0.88rem;`}>
          <span>Indlæser...</span>
        </div>
      </div>
    )
  }

  const canProceedAddress = !!(addressText && sqm && Number(sqm) > 0 && !outOfRange)

  return (
    <div style={s.wrap}>
      <Progress step={step} />

      {/* ── Step: Address ─────────────────────────────────────────── */}
      {step === "address" && (
        <>
          <h2 style={s.h2}>Beregn din pris</h2>
          <p style={s.subtitle}>Tast din adresse og vi henter resten fra BBR automatisk.</p>

          <div style="margin-bottom:20px;">
            <div
              style="position:relative;"
              tabIndex={-1}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            >
              <label style={s.label}>Adresse</label>
              <input
                style={s.input}
                type="text"
                placeholder="Indtast din adresse..."
                value={addressText}
                onInput={(e) => onAddressInput((e.target as HTMLInputElement).value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {bbrLoading && <p style={s.hint}>Henter ejendomsdata fra BBR...</p>}
              {showSuggestions && suggestions.length > 0 && (
                <div style={`position:absolute;z-index:99;width:100%;background:#fff;border:1.5px solid ${c.gray200};border-top:none;border-radius:0 0 10px 10px;box-shadow:0 8px 16px rgba(0,0,0,0.08);`}>
                  {suggestions.map((sg) => (
                    <div
                      key={sg.id}
                      style={`padding:11px 14px;font-size:0.87rem;cursor:pointer;border-bottom:1px solid ${c.gray100};color:${c.gray700};`}
                      onMouseDown={() => onSelectSuggestion(sg)}
                    >
                      {sg.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label style={s.label}>Ejendomstype</label>
            <div style={`display:flex;border:1.5px solid ${c.gray200};border-radius:10px;overflow:hidden;`}>
              {(["house", "apartment", "commercial"] as PropertyType[]).map((t, i) => (
                <button
                  key={t}
                  onClick={() => setPropertyType(t)}
                  style={`flex:1;padding:10px 6px;border:none;${i < 2 ? `border-right:1px solid ${c.gray200};` : ""}background:${propertyType === t ? c.blueLight : "#fff"};color:${propertyType === t ? c.blue : c.gray500};font-size:0.83rem;font-weight:600;cursor:pointer;font-family:${font};transition:background 0.1s;`}
                >
                  {PROPERTY_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label style={s.label}>Størrelse (m²)</label>
            <input
              style={s.input}
              type="number"
              min="1"
              placeholder={bbrLoading ? "Henter..." : "F.eks. 120"}
              value={sqm}
              onInput={(e) => setSqm((e.target as HTMLInputElement).value)}
            />
            {addressId && !bbrLoading && !sqm && (
              <p style={s.hint}>m² kunne ikke hentes automatisk — angiv venligst manuelt.</p>
            )}
          </div>

          {outOfRange && (
            <div style={`padding:12px 14px;background:${c.redLight};border:1px solid ${c.redBorder};border-radius:10px;margin-bottom:12px;`}>
              <p style={`color:${c.red};font-size:0.85rem;margin:0;font-weight:600;`}>Udenfor serviceområde</p>
              <p style={`color:${c.red};font-size:0.82rem;margin:4px 0 0;opacity:0.85;`}>Vi kører desværre ikke til din adresse. Kontakt os direkte for et tilbud.</p>
            </div>
          )}

          <button
            style={s.btn + (!canProceedAddress ? s.btnDisabled : "")}
            disabled={!canProceedAddress}
            onClick={goToPrice}
          >
            Se min pris →
          </button>
        </>
      )}

      {/* ── Step: Price ───────────────────────────────────────────── */}
      {step === "price" && breakdown && (
        <>
          <BackBtn onClick={() => setStep("address")} />
          <h2 style={s.h2}>Din pris</h2>
          <p style={s.subtitle}>{addressText}</p>

          {/* BBR chips */}
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:28px;margin-top:-12px;">
            <BbrChip>{PROPERTY_LABELS[propertyType]}</BbrChip>
            <BbrChip>{sqm} m²</BbrChip>
            {bbrFloors != null && <BbrChip>{bbrFloors} plan</BbrChip>}
            {bbrRooms != null && <BbrChip>{bbrRooms} rum</BbrChip>}
            {bbrBathrooms != null && <BbrChip>{bbrBathrooms} bad</BbrChip>}
            {bbrToilets != null && <BbrChip>{bbrToilets} toilet</BbrChip>}
          </div>

          {/* Auto-pålagte tillæg fra BBR (låst, ikke-klikbart) */}
          {autoAddOns.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Inkluderet fra BBR</p>
              <div style={`background:${c.gray50};border:1px solid ${c.gray200};border-radius:12px;overflow:hidden;`}>
                {autoAddOns.map((id) => {
                  const addon = settings.add_ons.find((a) => a.id === id)
                  if (!addon) return null
                  return (
                    <div key={id} style={`display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid ${c.gray100};`}>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.gray400} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span style={`font-size:0.85rem;color:${c.gray700};`}>{addon.name}</span>
                      </div>
                      <span style={`font-size:0.85rem;font-weight:600;color:${c.gray500};`}>+{addon.price.toLocaleString("da-DK")} kr</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Kæledyrsspørgsmål */}
          {settings.add_ons.some((a) => a.id === "addon_pets") && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Har du hund eller kat?</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <SelectCard
                  selected={hasPets === false}
                  onClick={() => setHasPets(false)}
                  title="Nej"
                  badge=""
                />
                <SelectCard
                  selected={hasPets === true}
                  onClick={() => setHasPets(true)}
                  title="Ja"
                  badge={`+${settings.add_ons.find((a) => a.id === "addon_pets")!.price.toLocaleString("da-DK")} kr`}
                />
              </div>
            </div>
          )}

          {/* Custom tillæg (ikke-predefined) */}
          {(() => {
            const PREDEFINED = new Set(["addon_extra_floor_apt","addon_extra_floor_house","addon_extra_bathroom","addon_pets","addon_no_parking"])
            const custom = settings.add_ons.filter((a) => !PREDEFINED.has(a.id))
            if (custom.length === 0) return null
            return (
              <div style={s.section}>
                <p style={s.sectionLabel}>Tilvalg</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
                  {custom.map((a) => (
                    <SelectCard
                      key={a.id}
                      selected={selectedAddOns.includes(a.id)}
                      onClick={() => toggleAddOn(a.id)}
                      title={a.name}
                      badge={`+${a.price.toLocaleString("da-DK")} kr`}
                    />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Hyppighedsrabat */}
          {settings.frequency_discounts.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Hvor ofte skal vi gøre rent?</p>
              <div style={`display:grid;grid-template-columns:repeat(${Math.min(settings.frequency_discounts.length, 4)},1fr);gap:10px;`}>
                {settings.frequency_discounts.map((f) => (
                  <SelectCard
                    key={f.frequency}
                    selected={selectedFrequency === f.frequency}
                    onClick={() => setSelectedFrequency(selectedFrequency === f.frequency ? null : f.frequency)}
                    title={FREQUENCY_LABELS[f.frequency]}
                    badge={f.discount_percentage > 0 ? `-${f.discount_percentage}%` : ""}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rabatter */}
          {settings.discounts.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Rabat</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">
                {settings.discounts.map((d) => (
                  <SelectCard
                    key={d.id}
                    selected={selectedDiscount === d.id}
                    onClick={() => setSelectedDiscount(selectedDiscount === d.id ? null : d.id)}
                    title={d.name}
                    badge={d.type === "percent" ? `-${d.value}%` : `-${d.value.toLocaleString("da-DK")} kr`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Price summary */}
          <div style="margin-bottom:4px;">
            <PriceSummary breakdown={breakdown} sqm={sqm} />
          </div>

          <button style={s.btn} onClick={() => setStep("action")}>
            Gå videre →
          </button>
        </>
      )}

      {/* ── Step: Action ──────────────────────────────────────────── */}
      {step === "action" && breakdown && (
        <>
          <BackBtn onClick={() => setStep("price")} />
          <h2 style={s.h2}>Hvad vil du gøre?</h2>
          <p style={s.subtitle}>
            Din pris: <strong style={`color:${c.blue};`}>{breakdown.total.toLocaleString("da-DK")} kr</strong>
          </p>

          {(["book", "callback", "email"] as ActionType[]).map((a) => {
            const meta = {
              book: { icon: "📅", title: "Book tid", desc: "Vælg en ledig tid direkte i kalenderen" },
              callback: { icon: "📞", title: "Bliv ringet op", desc: "Vi ringer dig op for at aftale nærmere" },
              email: { icon: "📧", title: "Modtag tilbud på email", desc: "Tilbuddet sendes til din indbakke" },
            }[a]
            const active = action === a
            return (
              <div
                key={a}
                onClick={() => setAction(a)}
                style={`border:2px solid ${active ? c.blue : c.gray200};background:${active ? c.blueLight : "#fff"};border-radius:14px;padding:16px 20px;cursor:pointer;margin-bottom:10px;transition:border-color 0.15s,background 0.15s;`}
              >
                <div style="display:flex;align-items:center;gap:14px;">
                  <span style={`font-size:1.5rem;line-height:1;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:${active ? "#fff" : c.gray50};border-radius:10px;flex-shrink:0;`}>{meta.icon}</span>
                  <div style="flex:1;">
                    <div style={`font-weight:700;font-size:0.95rem;color:${active ? c.blue : c.gray900};margin-bottom:3px;`}>{meta.title}</div>
                    <div style={`font-size:0.82rem;color:${c.gray500};`}>{meta.desc}</div>
                  </div>
                  <div style={`width:20px;height:20px;border-radius:50%;border:2px solid ${active ? c.blue : c.gray300};background:${active ? c.blue : "#fff"};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;`}>
                    {active && <div style="width:8px;height:8px;border-radius:50%;background:#fff;" />}
                  </div>
                </div>
              </div>
            )
          })}

          <button
            style={s.btn + (!action ? s.btnDisabled : "")}
            disabled={!action}
            onClick={() => action && goToContact(action)}
          >
            Fortsæt →
          </button>
        </>
      )}

      {/* ── Step: Contact ─────────────────────────────────────────── */}
      {step === "contact" && (
        <>
          <BackBtn onClick={() => setStep("action")} />
          <h2 style={s.h2}>{action === "book" ? "Book tid" : "Dine oplysninger"}</h2>
          <p style={s.subtitle}>{action === "book" ? "Udfyld dine oplysninger og vælg dato og tidspunkt." : "Vi kontakter dig hurtigst muligt."}</p>

          {/* ── To-kolonne layout ved booking ── */}
          {action === "book" ? (
            <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">

              {/* Venstre: kontaktoplysninger */}
              <div style="flex:1;min-width:200px;">
                <div style="margin-bottom:14px;">
                  <label style={s.label}>Fulde navn *</label>
                  <input style={s.input} type="text" value={name} placeholder="Dit fulde navn" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
                </div>
                <div style="margin-bottom:14px;">
                  <label style={s.label}>Email *</label>
                  <input style={s.input} type="email" value={email} placeholder="din@email.dk" onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
                </div>
                <div style="margin-bottom:14px;">
                  <label style={s.label}>Telefon *</label>
                  <input style={s.input} type="tel" value={phone} placeholder="+45 12 34 56 78" onInput={(e) => setPhone((e.target as HTMLInputElement).value)} />
                </div>
                <div>
                  <label style={s.label}>Bemærkninger <span style={`font-weight:400;color:${c.gray400};`}>(valgfrit)</span></label>
                  <textarea
                    style={`${s.input}min-height:80px;resize:vertical;line-height:1.5;`}
                    placeholder="Eventuelle kommentarer…"
                    value={notes}
                    onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
                  />
                </div>
              </div>

              {/* Højre: kalender + tidsvalg */}
              <div style="width:256px;flex-shrink:0;">
                <p style={`${s.sectionLabel}margin-bottom:8px;`}>Vælg dato</p>
                {loadingDates ? (
                  <div style={`color:${c.gray400};font-size:0.83rem;`}>Henter datoer…</div>
                ) : availableDates.length === 0 ? (
                  <div style={`color:${c.gray500};font-size:0.82rem;padding:10px 12px;background:${c.gray50};border:1px solid ${c.gray200};border-radius:10px;`}>
                    Ingen ledige tider de næste 30 dage.
                  </div>
                ) : (
                  <Calendar
                    availableDates={availableDates}
                    selectedDate={selectedDate}
                    onSelect={onSelectDate}
                  />
                )}

                {/* Tidsvindue — under kalenderen */}
                {selectedDate && (
                  <div style="margin-top:12px;">
                    <p style={`${s.sectionLabel}margin-bottom:8px;`}>Vælg tidspunkt</p>
                    {loadingSlots ? (
                      <div style={`color:${c.gray400};font-size:0.83rem;`}>Henter tider…</div>
                    ) : slotsForDate.length === 0 ? (
                      <div style={`color:${c.gray500};font-size:0.82rem;padding:10px 12px;background:${c.gray50};border:1px solid ${c.gray200};border-radius:10px;`}>
                        Ingen ledige tider denne dag.
                      </div>
                    ) : (
                      <div style="display:flex;flex-wrap:wrap;gap:6px;">
                        {slotsForDate.map((slot) => {
                          const d = new Date(slot)
                          const startH = d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                          const endH = new Date(d.getTime() + 7200000).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                          const sel = selectedSlot === slot
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(sel ? null : slot)}
                              style={`border:1.5px solid ${sel ? c.blue : c.gray200};background:${sel ? c.blueLight : "#fff"};border-radius:8px;padding:7px 10px;font-size:0.8rem;cursor:pointer;font-family:${font};color:${sel ? c.blue : c.gray700};font-weight:${sel ? "700" : "500"};transition:all 0.15s;white-space:nowrap;`}
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

            </div>
          ) : (
            /* ── Enkelt-kolonne ved callback / email ── */
            <div>
              <div style="margin-bottom:14px;">
                <label style={s.label}>Fulde navn *</label>
                <input style={s.input} type="text" value={name} placeholder="Dit fulde navn" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
              </div>
              {action === "email" && (
                <div style="margin-bottom:14px;">
                  <label style={s.label}>Email *</label>
                  <input style={s.input} type="email" value={email} placeholder="din@email.dk" onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
                </div>
              )}
              <div style="margin-bottom:14px;">
                <label style={s.label}>Telefon *</label>
                <input style={s.input} type="tel" value={phone} placeholder="+45 12 34 56 78" onInput={(e) => setPhone((e.target as HTMLInputElement).value)} />
              </div>
              <div>
                <label style={s.label}>Bemærkninger <span style={`font-weight:400;color:${c.gray400};`}>(valgfrit)</span></label>
                <textarea
                  style={`${s.input}min-height:80px;resize:vertical;line-height:1.5;`}
                  placeholder="Eventuelle kommentarer…"
                  value={notes}
                  onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
                />
              </div>
            </div>
          )}

          {submitError && <p style={`${s.error}margin-top:16px;`}>{submitError}</p>}

          {(() => {
            const disabled = !name || !phone || (action !== "callback" && !email) || (action === "book" && (!selectedDate || !selectedSlot)) || submitting
            const label = submitting ? "Sender..." : action === "book" ? "Book tid" : action === "callback" ? "Bliv ringet op" : "Send tilbud"
            return (
              <button style={`${s.btn}margin-top:20px;` + (disabled ? s.btnDisabled : "")} disabled={disabled} onClick={handleSubmit}>
                {label}
              </button>
            )
          })()}
        </>
      )}

      {/* ── Step: Confirmation ────────────────────────────────────── */}
      {step === "confirmation" && (
        <div style="text-align:center;padding:32px 0 24px;">
          <div style={`width:72px;height:72px;border-radius:50%;background:${c.greenLight};border:2px solid #bbf7d0;display:flex;align-items:center;justify-content:center;margin:0 auto 22px;`}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={`font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin:0 0 10px;color:${c.gray900};`}>
            {action === "book" ? "Tak! Din tid er booket." : action === "callback" ? "Tak! Vi ringer dig op." : "Tak! Tilbuddet er sendt."}
          </h2>
          <p style={`font-size:0.9rem;color:${c.gray500};max-width:340px;margin:0 auto;line-height:1.6;`}>
            {action === "book"
              ? "Du vil modtage en bekræftelse på email. Vi ser frem til at møde dig!"
              : action === "callback"
              ? "Vi kontakter dig hurtigst muligt på det oplyste telefonnummer."
              : "Tjek din indbakke — tilbuddet er på vej til dig."}
          </p>
        </div>
      )}
    </div>
  )
}
