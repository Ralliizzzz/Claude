import { h, Fragment } from "preact"
import type { ComponentChildren } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import type { QuoteSettings, PropertyType, ActionType, Step, PriceBreakdown, FrequencyKey } from "./types"
import { fetchSettings, fetchAddressSuggestions, fetchBBRData, fetchSlots, submitLead } from "./api"
import { calculatePrice } from "./calc"

// ─── Design tokens ─────────────────────────────────────────────────────────
const c = {
  teal:        "#0d9488",
  tealLight:   "#f0fdfa",
  tealBorder:  "#99f6e4",
  tealDark:    "#0f766e",
  blue:        "#2563eb",
  blueLight:   "#eff6ff",
  gray50:      "#f9fafb",
  gray100:     "#f3f4f6",
  gray200:     "#e5e7eb",
  gray300:     "#d1d5db",
  gray400:     "#9ca3af",
  gray500:     "#6b7280",
  gray600:     "#4b5563",
  gray700:     "#374151",
  gray900:     "#111827",
  green:       "#16a34a",
  greenLight:  "#f0fdf4",
  red:         "#dc2626",
  redLight:    "#fef2f2",
  redBorder:   "#fecaca",
}

const font = "Inter,'Segoe UI',system-ui,sans-serif"

const s = {
  wrap:    `font-family:${font};max-width:740px;width:100%;background:#fff;border:1px solid ${c.gray200};border-radius:16px;overflow:hidden;box-sizing:border-box;color:${c.gray900};box-shadow:0 2px 8px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.04);margin:0 auto;`,
  body:    "padding:28px 28px 0;",
  label:   `display:block;font-size:0.7rem;font-weight:700;color:${c.gray400};margin-bottom:8px;text-transform:uppercase;letter-spacing:0.07em;`,
  input:   `width:100%;border:1.5px solid ${c.gray200};border-radius:10px;padding:12px 14px;font-size:0.93rem;box-sizing:border-box;outline:none;font-family:${font};color:${c.gray900};background:#fff;transition:border-color 0.15s;`,
  btn:     `width:100%;background:${c.blue};color:#fff;border:none;border-radius:10px;padding:14px 24px;font-size:0.95rem;font-weight:700;cursor:pointer;font-family:${font};letter-spacing:0.01em;`,
  btnDisabled: "opacity:0.4;cursor:not-allowed;",
  btnBack: `background:none;border:none;color:${c.gray400};font-size:0.82rem;cursor:pointer;padding:0;margin-bottom:20px;font-family:${font};display:flex;align-items:center;gap:5px;`,
  hint:    `font-size:0.78rem;color:${c.gray400};margin-top:6px;`,
  error:   `color:${c.red};font-size:0.85rem;padding:12px 16px;background:${c.redLight};border:1px solid ${c.redBorder};border-radius:10px;margin-top:10px;`,
  h2:      `font-size:1.35rem;font-weight:800;margin:0 0 4px;color:${c.gray900};letter-spacing:-0.02em;`,
  subtitle:`font-size:0.87rem;color:${c.gray500};margin:0 0 24px;line-height:1.5;`,
  q:       `font-size:0.92rem;font-weight:700;color:${c.gray900};margin:0 0 12px;`,
  section: "margin-bottom:24px;",
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const PROPERTY_LABELS: Record<PropertyType, string> = {
  house: "Villa / Hus", apartment: "Lejlighed", commercial: "Erhverv",
}

const FREQUENCY_LABELS: Record<FrequencyKey, string> = {
  weekly: "Hver uge", every2weeks: "Hver 2. uge", every3weeks: "Hver 3. uge", every4weeks: "Hver 4. uge",
}

const STEP_NUM: Record<Step, number> = {
  address: 1, price: 2, action: 3, contact: 4, confirmation: 4,
}

// ─── Progress bar ──────────────────────────────────────────────────────────

const STEP_LABELS = ["Adresse", "Pris", "Handling", "Kontakt"]

function Progress({ step }: { step: Step }) {
  const n = STEP_NUM[step]
  const done = step === "confirmation"
  return (
    <div style={`padding:0 28px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid ${c.gray100};`}>
      <div style="display:flex;gap:0;margin-bottom:8px;">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style="flex:1;display:flex;align-items:center;">
            <div style={`flex:1;height:3px;border-radius:2px;background:${done || i <= n ? c.teal : c.gray200};transition:background 0.25s;`} />
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
              <div style={`width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;margin-bottom:3px;${
                completed ? `background:${c.teal};color:#fff;` : active ? `background:${c.teal};color:#fff;` : `background:${c.gray100};color:${c.gray400};`
              }`}>
                {completed && idx < n
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : String(idx)}
              </div>
              <span style={`font-size:0.63rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${active || completed ? c.teal : c.gray400};`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SelectCard ────────────────────────────────────────────────────────────

interface SelectCardProps {
  selected: boolean
  onClick: () => void
  title: string
  subtitle?: string
}

function SelectCard({ selected, onClick, title, subtitle }: SelectCardProps) {
  return (
    <div
      onClick={onClick}
      style={`position:relative;border:1.5px solid ${selected ? c.teal : c.gray200};background:${selected ? c.tealLight : "#fff"};border-radius:10px;padding:12px 14px;cursor:pointer;transition:border-color 0.15s,background 0.15s;text-align:center;`}
    >
      {selected && (
        <div style={`position:absolute;top:-8px;right:-8px;width:18px;height:18px;border-radius:50%;background:${c.teal};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(13,148,136,0.4);`}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <div style={`font-weight:600;font-size:0.87rem;color:${selected ? c.teal : c.gray700};`}>{title}</div>
      {subtitle && (
        <div style={`font-size:0.75rem;color:${selected ? c.teal : c.gray400};margin-top:3px;font-weight:500;`}>{subtitle}</div>
      )}
    </div>
  )
}

// ─── Price section ─────────────────────────────────────────────────────────

function PriceSection({ breakdown, sqm, frequencyLabel }: { breakdown: PriceBreakdown; sqm: string; frequencyLabel: string | null }) {
  const subtotal = breakdown.base + breakdown.add_ons.reduce((s, a) => s + a.price, 0) + (breakdown.transport_fee?.amount ?? 0)
  const totalDiscount = (breakdown.discount?.value ?? 0) + (breakdown.frequency_discount?.value ?? 0)
  const hasDiscount = totalDiscount < 0

  return (
    <div style={`background:${c.gray50};border-top:1px solid ${c.gray200};padding:24px 28px 28px;margin-top:8px;`}>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style={`font-size:1rem;font-weight:800;color:${c.gray900};`}>Din pris</span>
        {hasDiscount && breakdown.frequency_discount && frequencyLabel && (
          <span style={`background:${c.teal};color:#fff;font-size:0.72rem;font-weight:700;padding:4px 10px;border-radius:20px;`}>
            {Math.abs(breakdown.frequency_discount.value / (subtotal) * 100).toFixed(0)}% rabat
          </span>
        )}
        {hasDiscount && breakdown.discount && !breakdown.frequency_discount && (
          <span style={`background:${c.teal};color:#fff;font-size:0.72rem;font-weight:700;padding:4px 10px;border-radius:20px;`}>
            Rabat aktiv
          </span>
        )}
      </div>

      {/* Line items */}
      <PriceLine label={`Rengøring af ${sqm} m²`} value={breakdown.base} />
      {breakdown.add_ons.map((a) => (
        <PriceLine key={a.name} label={`Tillæg ${a.name.toLowerCase()}`} value={a.price} />
      ))}
      {breakdown.transport_fee && (
        <PriceLine
          label={`Kørsel udover ${breakdown.transport_fee.billable_km} km (${breakdown.transport_fee.billable_km} km · ${breakdown.transport_fee.price_per_km} kr/km)`}
          value={breakdown.transport_fee.amount}
        />
      )}

      {/* Subtotal */}
      <div style={`display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid ${c.gray200};margin-top:4px;`}>
        <span style={`font-size:0.87rem;color:${c.gray600};`}>Pris pr. rengøring</span>
        <span style={`font-size:0.87rem;font-weight:600;color:${c.gray900};`}>{subtotal.toLocaleString("da-DK")} kr</span>
      </div>

      {/* Discounts */}
      {breakdown.frequency_discount && (
        <PriceLine label={`${frequencyLabel ?? ""} hyppighedsrabat`} value={breakdown.frequency_discount.value} discount />
      )}
      {breakdown.discount && (
        <PriceLine label={breakdown.discount.name} value={breakdown.discount.value} discount />
      )}

      {/* Final */}
      {hasDiscount && (
        <div style={`display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid ${c.gray200};margin-top:4px;`}>
          <span style={`font-size:0.87rem;color:${c.gray600};`}>Pris efter rabat</span>
          <span style={`font-size:0.87rem;font-weight:600;color:${c.gray900};`}>{(subtotal + totalDiscount).toLocaleString("da-DK")} kr</span>
        </div>
      )}

      <div style={`display:flex;justify-content:space-between;align-items:baseline;padding-top:12px;border-top:2px solid ${c.gray200};margin-top:${hasDiscount ? "4" : "8"}px;`}>
        <span style={`font-size:0.87rem;font-weight:700;color:${c.gray900};`}>Pris inkl. moms</span>
        <span style={`font-size:1.6rem;font-weight:800;color:${c.gray900};letter-spacing:-0.03em;`}>
          {breakdown.total.toLocaleString("da-DK")} <span style="font-size:1rem;">kr</span>
        </span>
      </div>
    </div>
  )
}

function PriceLine({ label, value, discount }: { label: string; value: number; discount?: boolean }) {
  return (
    <div style={`display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;`}>
      <span style={`font-size:0.85rem;color:${discount ? c.green : c.gray600};`}>{label}</span>
      <span style={`font-size:0.85rem;font-weight:500;color:${discount ? c.green : c.gray900};white-space:nowrap;margin-left:12px;`}>
        {discount && value < 0 ? "" : ""}{value.toLocaleString("da-DK")} kr
      </span>
    </div>
  )
}

// ─── Misc components ───────────────────────────────────────────────────────

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button style={s.btnBack} onClick={onClick}>← Tilbage</button>
}

function BbrChip({ children }: { children: ComponentChildren }) {
  return (
    <span style={`display:inline-flex;align-items:center;font-size:0.73rem;color:${c.gray500};background:#fff;border:1px solid ${c.gray200};border-radius:6px;padding:3px 8px;`}>
      {children}
    </span>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App({ companyId }: { companyId: string }) {
  const [step, setStep] = useState<Step>("address")
  const [settings, setSettings] = useState<QuoteSettings | null>(null)
  const [loadError, setLoadError] = useState(false)

  const [addressText, setAddressText] = useState("")
  const [addressId, setAddressId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<{ text: string; id: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [propertyType, setPropertyType] = useState<PropertyType>("house")
  const [sqm, setSqm] = useState("")
  const [bbrLoading, setBbrLoading] = useState(false)
  const [nearestDistanceKm, setNearestDistanceKm] = useState<number | null>(null)
  const [outOfRange, setOutOfRange] = useState(false)
  const [bbrRooms, setBbrRooms] = useState<number | null>(null)
  const [bbrToilets, setBbrToilets] = useState<number | null>(null)
  const [bbrBathrooms, setBbrBathrooms] = useState<number | null>(null)
  const [bbrFloors, setBbrFloors] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null)
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyKey | null>(null)
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null)

  const [action, setAction] = useState<ActionType | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
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

      if (settings?.locations && settings.locations.length > 0) {
        if (!bbr.lat || !bbr.lon) {
          setOutOfRange(true)
          setNearestDistanceKm(null)
        } else {
          const distances = settings.locations.map((loc) => ({ loc, km: haversineKm(bbr.lat!, bbr.lon!, loc.lat, loc.lon) }))
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

  function goToPrice() {
    if (!settings || !sqm || Number(sqm) <= 0 || outOfRange) return
    const bd = calculatePrice(Number(sqm), settings, selectedAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm)
    setBreakdown(bd)
    setStep("price")
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  useEffect(() => {
    if (!settings || !sqm) return
    const bd = calculatePrice(Number(sqm), settings, selectedAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm)
    setBreakdown(bd)
  }, [selectedAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm, settings, sqm])

  async function goToContact(chosenAction: ActionType) {
    setAction(chosenAction)
    if (chosenAction === "book") {
      const s = await fetchSlots(companyId)
      setSlots(s)
    }
    setStep("contact")
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
        address: addressText, sqm: Number(sqm) || undefined,
        property_type: propertyType, price: breakdown.total,
        price_breakdown: breakdown, action_type: action,
        scheduled_at: selectedSlot ?? undefined,
      })
      setStep("confirmation")
    } catch {
      setSubmitError("Noget gik galt. Prøv igen.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) return (
    <div style={s.wrap}>
      <div style={s.body}>
        <p style={`color:${c.red};font-size:0.9rem;padding-bottom:28px;`}>Kunne ikke indlæse widget. Prøv igen.</p>
      </div>
    </div>
  )

  if (!settings) return (
    <div style={s.wrap}>
      <div style={s.body}>
        <p style={`color:${c.gray400};font-size:0.88rem;padding-bottom:28px;`}>Indlæser...</p>
      </div>
    </div>
  )

  const canProceedAddress = !!(addressText && sqm && Number(sqm) > 0 && !outOfRange)
  const activeFreqLabel = selectedFrequency ? FREQUENCY_LABELS[selectedFrequency] : null

  return (
    <div style={s.wrap}>
      {/* Progress lives outside body padding so bars touch edges */}
      <div style="padding-top:24px;">
        <Progress step={step} />
      </div>

      {/* ── Step: Address ──────────────────────────────────── */}
      {step === "address" && (
        <>
          <div style={s.body}>
            <h2 style={s.h2}>Beregn din pris</h2>
            <p style={s.subtitle}>Tast din adresse og vi henter resten fra BBR automatisk.</p>

            {/* Ejendomstype tabs */}
            <div style={s.section}>
              <p style={s.q}>Hvilken type ejendom?</p>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                {(["house", "apartment", "commercial"] as PropertyType[]).map((t) => (
                  <SelectCard
                    key={t}
                    selected={propertyType === t}
                    onClick={() => setPropertyType(t)}
                    title={PROPERTY_LABELS[t]}
                  />
                ))}
              </div>
            </div>

            {/* Adresse */}
            <div style={s.section}>
              <p style={s.q}>Hvad er din adresse?</p>
              <div
                style="position:relative;"
                tabIndex={-1}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              >
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

            {/* Størrelse */}
            <div style={s.section}>
              <p style={s.q}>Boligens størrelse (m²)</p>
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
              <div style={`padding:12px 14px;background:${c.redLight};border:1px solid ${c.redBorder};border-radius:10px;margin-bottom:16px;`}>
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
          </div>
          <div style="height:28px;" />
        </>
      )}

      {/* ── Step: Price ────────────────────────────────────── */}
      {step === "price" && breakdown && (
        <>
          <div style={s.body}>
            <BackBtn onClick={() => setStep("address")} />

            {/* BBR chips */}
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:24px;">
              <BbrChip>{PROPERTY_LABELS[propertyType]}</BbrChip>
              <BbrChip>{sqm} m²</BbrChip>
              {bbrFloors != null && <BbrChip>{bbrFloors} plan</BbrChip>}
              {bbrRooms != null && <BbrChip>{bbrRooms} rum</BbrChip>}
              {bbrBathrooms != null && <BbrChip>{bbrBathrooms} bad</BbrChip>}
              {bbrToilets != null && <BbrChip>{bbrToilets} toilet</BbrChip>}
            </div>

            {/* Tilvalg */}
            {settings.add_ons.filter((a) => a.price > 0).length > 0 && (
              <div style={s.section}>
                <p style={s.q}>Hvilke tilvalg ønsker du?</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;">
                  {settings.add_ons.filter((a) => a.price > 0).map((a) => (
                    <SelectCard
                      key={a.id}
                      selected={selectedAddOns.includes(a.id)}
                      onClick={() => toggleAddOn(a.id)}
                      title={a.name}
                      subtitle={`+${a.price.toLocaleString("da-DK")} kr`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hyppighedsrabat */}
            {settings.frequency_discounts.length > 0 && (
              <div style={s.section}>
                <p style={s.q}>Hvor ofte skal vi gøre rent?</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                  {settings.frequency_discounts.map((f) => (
                    <SelectCard
                      key={f.frequency}
                      selected={selectedFrequency === f.frequency}
                      onClick={() => setSelectedFrequency(selectedFrequency === f.frequency ? null : f.frequency)}
                      title={FREQUENCY_LABELS[f.frequency]}
                      subtitle={`${f.discount_percentage}% rabat`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rabatter */}
            {settings.discounts.length > 0 && (
              <div style={s.section}>
                <p style={s.q}>Har du en rabatkode?</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">
                  {settings.discounts.map((d) => (
                    <SelectCard
                      key={d.id}
                      selected={selectedDiscount === d.id}
                      onClick={() => setSelectedDiscount(selectedDiscount === d.id ? null : d.id)}
                      title={d.name}
                      subtitle={d.type === "percent" ? `-${d.value}%` : `-${d.value.toLocaleString("da-DK")} kr`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price panel — full-width gray block */}
          <PriceSection breakdown={breakdown} sqm={sqm} frequencyLabel={activeFreqLabel} />

          <div style="padding:16px 28px 24px;">
            <button style={s.btn} onClick={() => setStep("action")}>
              Gå videre →
            </button>
          </div>
        </>
      )}

      {/* ── Step: Action ───────────────────────────────────── */}
      {step === "action" && breakdown && (
        <>
          <div style={s.body}>
            <BackBtn onClick={() => setStep("price")} />
            <h2 style={s.h2}>Hvad vil du gøre?</h2>
            <p style={s.subtitle}>
              Din pris: <strong style={`color:${c.teal};`}>{breakdown.total.toLocaleString("da-DK")} kr</strong>
            </p>

            {(["book", "callback", "email"] as ActionType[]).map((a) => {
              const meta = {
                book:     { icon: "📅", title: "Book tid",              desc: "Vælg en ledig tid direkte i kalenderen" },
                callback: { icon: "📞", title: "Bliv ringet op",        desc: "Vi ringer dig op for at aftale nærmere" },
                email:    { icon: "📧", title: "Modtag tilbud på email", desc: "Tilbuddet sendes til din indbakke" },
              }[a]
              const active = action === a
              return (
                <div
                  key={a}
                  onClick={() => setAction(a)}
                  style={`border:1.5px solid ${active ? c.teal : c.gray200};background:${active ? c.tealLight : "#fff"};border-radius:12px;padding:14px 18px;cursor:pointer;margin-bottom:10px;transition:border-color 0.15s,background 0.15s;`}
                >
                  <div style="display:flex;align-items:center;gap:12px;">
                    <span style={`font-size:1.4rem;line-height:1;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${active ? "#fff" : c.gray50};border-radius:8px;flex-shrink:0;`}>{meta.icon}</span>
                    <div style="flex:1;">
                      <div style={`font-weight:700;font-size:0.92rem;color:${active ? c.teal : c.gray900};margin-bottom:2px;`}>{meta.title}</div>
                      <div style={`font-size:0.8rem;color:${c.gray400};`}>{meta.desc}</div>
                    </div>
                    <div style={`width:18px;height:18px;border-radius:50%;border:2px solid ${active ? c.teal : c.gray300};background:${active ? c.teal : "#fff"};display:flex;align-items:center;justify-content:center;flex-shrink:0;`}>
                      {active && <div style="width:7px;height:7px;border-radius:50%;background:#fff;" />}
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
          </div>
          <div style="height:28px;" />
        </>
      )}

      {/* ── Step: Contact ──────────────────────────────────── */}
      {step === "contact" && (
        <>
          <div style={s.body}>
            <BackBtn onClick={() => setStep("action")} />
            <h2 style={s.h2}>Dine oplysninger</h2>
            <p style={s.subtitle}>Vi kontakter dig hurtigst muligt.</p>

            <div style={s.section}>
              <label style={s.label}>Fulde navn *</label>
              <input style={s.input} type="text" value={name} placeholder="Dit fulde navn" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
            </div>

            {(action === "email" || action === "book") && (
              <div style={s.section}>
                <label style={s.label}>Email *</label>
                <input style={s.input} type="email" value={email} placeholder="din@email.dk" onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
              </div>
            )}

            <div style={s.section}>
              <label style={s.label}>Telefon *</label>
              <input style={s.input} type="tel" value={phone} placeholder="+45 12 34 56 78" onInput={(e) => setPhone((e.target as HTMLInputElement).value)} />
            </div>

            {action === "book" && slots.length > 0 && (
              <div style={s.section}>
                <label style={s.label}>Vælg tid *</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:200px;overflow-y:auto;">
                  {slots.map((slot) => {
                    const d = new Date(slot)
                    const label = d.toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                    const sel = selectedSlot === slot
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        style={`border:1.5px solid ${sel ? c.teal : c.gray200};background:${sel ? c.tealLight : "#fff"};border-radius:8px;padding:9px 8px;font-size:0.8rem;cursor:pointer;text-align:center;font-family:${font};color:${sel ? c.teal : c.gray700};font-weight:${sel ? "700" : "500"};`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {submitError && <p style={s.error}>{submitError}</p>}

            {(() => {
              const disabled = !name || !phone || (action !== "callback" && !email) || (action === "book" && !selectedSlot) || submitting
              const label = submitting ? "Sender..." : action === "book" ? "Book tid" : action === "callback" ? "Bliv ringet op" : "Send tilbud"
              return (
                <button style={s.btn + (disabled ? s.btnDisabled : "")} disabled={disabled} onClick={handleSubmit}>
                  {label}
                </button>
              )
            })()}
          </div>
          <div style="height:28px;" />
        </>
      )}

      {/* ── Step: Confirmation ─────────────────────────────── */}
      {step === "confirmation" && (
        <div style="text-align:center;padding:40px 28px 48px;">
          <div style={`width:68px;height:68px;border-radius:50%;background:${c.tealLight};border:2px solid ${c.tealBorder};display:flex;align-items:center;justify-content:center;margin:0 auto 20px;`}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={c.teal} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={`font-size:1.4rem;font-weight:800;letter-spacing:-0.02em;margin:0 0 10px;color:${c.gray900};`}>
            {action === "book" ? "Tak! Din tid er booket." : action === "callback" ? "Tak! Vi ringer dig op." : "Tak! Tilbuddet er sendt."}
          </h2>
          <p style={`font-size:0.88rem;color:${c.gray500};max-width:320px;margin:0 auto;line-height:1.6;`}>
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
