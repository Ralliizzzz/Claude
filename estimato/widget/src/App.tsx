import { h, Fragment } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import type { QuoteSettings, PropertyType, ActionType, Step, PriceBreakdown, FrequencyKey } from "./types"
import { fetchSettings, fetchAddressSuggestions, fetchBBRData, fetchSlots, submitLead } from "./api"
import { calculatePrice } from "./calc"

// ─── Styles ────────────────────────────────────────────────────────────────
const s = {
  wrap: "font-family:Inter,system-ui,sans-serif;max-width:700px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;box-sizing:border-box;",
  h2: "font-size:1.1rem;font-weight:700;margin:0 0 16px;color:#111;",
  label: "display:block;font-size:0.8rem;font-weight:600;color:#374151;margin-bottom:4px;",
  input: "width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font-size:0.9rem;box-sizing:border-box;outline:none;",
  inputFocus: "border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15);",
  btn: "width:100%;background:#3b82f6;color:#fff;border:none;border-radius:8px;padding:12px;font-size:0.9rem;font-weight:600;cursor:pointer;margin-top:16px;",
  btnSecondary: "width:100%;background:#f9fafb;color:#374151;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:0.9rem;font-weight:600;cursor:pointer;margin-top:8px;",
  error: "color:#ef4444;font-size:0.8rem;margin-top:4px;",
  badge: "font-size:0.75rem;padding:2px 8px;border-radius:999px;font-weight:600;",
  priceRow: "display:flex;justify-content:space-between;font-size:0.9rem;padding:6px 0;border-bottom:1px solid #f3f4f6;",
  total: "display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;padding:10px 0;",
  actionCard: "border:2px solid #e5e7eb;border-radius:12px;padding:16px;cursor:pointer;margin-bottom:8px;transition:border-color 0.15s;",
  actionCardActive: "border-color:#3b82f6;background:#eff6ff;",
  fieldset: "margin-bottom:14px;",
  hint: "font-size:0.78rem;color:#6b7280;margin-top:4px;",
}

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

function PropertyInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style="display:flex;flex-direction:column;margin-bottom:8px;">
      <span style="font-size:0.68rem;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">{label}</span>
      <span style="font-size:0.82rem;color:#111;font-weight:500;margin-top:1px;">{value}</span>
    </div>
  )
}

interface AppProps {
  companyId: string
}

export default function App({ companyId }: AppProps) {
  const [step, setStep] = useState<Step>("address")
  const [settings, setSettings] = useState<QuoteSettings | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Address step
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

  // Price step
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null)
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyKey | null>(null)
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null)

  // Action step
  const [action, setAction] = useState<ActionType | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Contact step
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings(companyId).then(setSettings).catch(() => setLoadError(true))
  }, [companyId])

  // Adresse autocomplete
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

  async function onSelectSuggestion(s: { text: string; id: string }) {
    setAddressText(s.text)
    setAddressId(s.id)
    setSuggestions([])
    setShowSuggestions(false)
    setBbrLoading(true)
    try {
      const bbr = await fetchBBRData(s.id)
      if (bbr.sqm) setSqm(String(Math.round(bbr.sqm)))
      if (bbr.propertyType) setPropertyType(bbr.propertyType as PropertyType)
      setBbrRooms(bbr.rooms)
      setBbrToilets(bbr.toilets)
      setBbrBathrooms(bbr.bathrooms)
      setBbrFloors(bbr.floors)
      setCustomerLat(bbr.lat)
      setCustomerLon(bbr.lon)

      // Afstandstjek + gem nærmeste afstand til transportgebyr
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
        // Ingen serviceområde — beregn stadig afstand til transportgebyr
        if (bbr.lat && bbr.lon && settings?.locations?.length === 0) {
          setNearestDistanceKm(null)
        }
        setOutOfRange(false)
      }
    } catch {
      // BBR fejlede — brugeren angiver manuelt
    } finally {
      setBbrLoading(false)
    }
  }

  function goToPrice() {
    if (!settings || !sqm || Number(sqm) <= 0) return
    if (outOfRange) return

    const bd = calculatePrice(Number(sqm), settings, selectedAddOns, selectedDiscount, selectedFrequency, nearestDistanceKm)
    setBreakdown(bd)
    setStep("price")
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
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
        name,
        email: email || undefined,
        phone,
        address: addressText,
        sqm: Number(sqm) || undefined,
        property_type: propertyType,
        price: breakdown.total,
        price_breakdown: breakdown,
        action_type: action,
        scheduled_at: selectedSlot ?? undefined,
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
        <p style="color:#ef4444;font-size:0.9rem;">Kunne ikke indlæse widget. Prøv igen.</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div style={s.wrap}>
        <p style="color:#9ca3af;font-size:0.9rem;">Indlæser...</p>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      {/* ── Step: Address ── */}
      {step === "address" && (
        <>
          <h2 style={s.h2}>Få din pris</h2>

          <div style={s.fieldset} tabIndex={-1} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}>
            <label style={s.label}>Adresse</label>
            <input
              style={s.input}
              type="text"
              placeholder="Indtast adresse..."
              value={addressText}
              onInput={(e) => onAddressInput((e.target as HTMLInputElement).value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {showSuggestions && (
              <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;position:absolute;z-index:99;width:100%;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    style="padding:10px 12px;font-size:0.85rem;cursor:pointer;border-bottom:1px solid #f3f4f6;"
                    onMouseDown={() => onSelectSuggestion(s)}
                  >
                    {s.text}
                  </div>
                ))}
              </div>
            )}
            {bbrLoading && <p style={s.hint}>Henter ejendomsdata...</p>}
          </div>

          <div style={s.fieldset}>
            <label style={s.label}>Ejendomstype</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              {(["house", "apartment", "commercial"] as PropertyType[]).map((t) => (
                <button
                  key={t}
                  style={`border:2px solid ${propertyType === t ? "#3b82f6" : "#e5e7eb"};background:${propertyType === t ? "#eff6ff" : "#fff"};color:${propertyType === t ? "#1d4ed8" : "#374151"};border-radius:8px;padding:8px 14px;font-size:0.83rem;font-weight:600;cursor:pointer;`}
                  onClick={() => setPropertyType(t)}
                >
                  {PROPERTY_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div style={s.fieldset}>
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
            <p style="color:#ef4444;font-size:0.85rem;margin-bottom:8px;padding:10px 12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
              Vi kører desværre ikke til din adresse. Kontakt os direkte for et tilbud.
            </p>
          )}

          <button
            style={s.btn + ((!addressText || !sqm || outOfRange) ? "opacity:0.5;" : "")}
            disabled={!addressText || !sqm || outOfRange}
            onClick={goToPrice}
          >
            Se min pris →
          </button>
        </>
      )}

      {/* ── Step: Price ── */}
      {step === "price" && breakdown && (
        <>
          <button style="background:none;border:none;color:#6b7280;font-size:0.83rem;cursor:pointer;padding:0;margin-bottom:16px;" onClick={() => setStep("address")}>
            ← Tilbage
          </button>

          <div style="display:flex;gap:20px;align-items:flex-start;">

            {/* ── Boliginfo sidebar ── */}
            <div style="flex:0 0 180px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;font-size:0.82rem;">
              <p style="font-size:0.7rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Boliginfo</p>
              <PropertyInfoRow label="Ejendomstype" value={PROPERTY_LABELS[propertyType]} />
              <PropertyInfoRow label="Areal" value={`${sqm} m²`} />
              {bbrFloors != null && <PropertyInfoRow label="Antal plan" value={String(bbrFloors)} />}
              {bbrRooms != null && <PropertyInfoRow label="Værelser" value={String(bbrRooms)} />}
              {(bbrToilets != null || bbrBathrooms != null) && (
                <PropertyInfoRow
                  label="Toilet / bad"
                  value={[bbrToilets != null ? `${bbrToilets} toilet` : null, bbrBathrooms != null ? `${bbrBathrooms} bad` : null].filter(Boolean).join(" · ")}
                />
              )}
              <p style="font-size:0.7rem;color:#d1d5db;margin:10px 0 0;line-height:1.3;">Data fra BBR</p>
            </div>

            {/* ── Prisindhold ── */}
            <div style="flex:1;min-width:0;">
              <h2 style={s.h2}>Din pris</h2>

              <div style="margin-bottom:16px;">
                <div style={s.priceRow}>
                  <span>Grundpris ({sqm} m²)</span>
                  <span>{breakdown.base.toLocaleString("da-DK")} kr</span>
                </div>
                {breakdown.add_ons.map((a) => (
                  <div key={a.name} style={s.priceRow}>
                    <span>{a.name}</span>
                    <span>+{a.price.toLocaleString("da-DK")} kr</span>
                  </div>
                ))}
                {breakdown.discount && (
                  <div style={s.priceRow}>
                    <span>{breakdown.discount.name}</span>
                    <span style="color:#16a34a;">{breakdown.discount.value.toLocaleString("da-DK")} kr</span>
                  </div>
                )}
                {breakdown.frequency_discount && (
                  <div style={s.priceRow}>
                    <span>Hyppighedsrabat ({breakdown.frequency_discount.name})</span>
                    <span style="color:#16a34a;">{breakdown.frequency_discount.value.toLocaleString("da-DK")} kr</span>
                  </div>
                )}
                {breakdown.transport_fee && (
                  <div style={s.priceRow}>
                    <div>
                      <div>Transportgebyr</div>
                      <div style="font-size:0.75rem;color:#9ca3af;margin-top:2px;">
                        {breakdown.transport_fee.distance_km} km afstand · {breakdown.transport_fee.billable_km} km fakturerbart × {breakdown.transport_fee.price_per_km} kr/km
                      </div>
                    </div>
                    <span style="white-space:nowrap;">+{breakdown.transport_fee.amount.toLocaleString("da-DK")} kr</span>
                  </div>
                )}
                <div style={s.total}>
                  <span>I alt</span>
                  <span>{breakdown.total.toLocaleString("da-DK")} kr</span>
                </div>
              </div>

              {settings.add_ons.filter((a) => a.price > 0).length > 0 && (
                <div style={s.fieldset}>
                  <label style={s.label}>Tilvalg</label>
                  {settings.add_ons.filter((a) => a.price > 0).map((a) => (
                    <label key={a.id} style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;font-size:0.88rem;">
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(a.id)}
                        onChange={() => toggleAddOn(a.id)}
                        style="width:16px;height:16px;accent-color:#3b82f6;"
                      />
                      <span style="flex:1;">{a.name}</span>
                      <span style="color:#6b7280;">+{a.price.toLocaleString("da-DK")} kr</span>
                    </label>
                  ))}
                </div>
              )}

              {settings.frequency_discounts.length > 0 && (
                <div style={s.fieldset}>
                  <label style={s.label}>Hyppighedsrabat</label>
                  {settings.frequency_discounts.map((f) => (
                    <label key={f.frequency} style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;font-size:0.88rem;">
                      <input
                        type="radio"
                        name="frequency"
                        checked={selectedFrequency === f.frequency}
                        onClick={() => setSelectedFrequency(selectedFrequency === f.frequency ? null : f.frequency)}
                        onChange={() => {}}
                        style="width:16px;height:16px;accent-color:#3b82f6;"
                      />
                      <span style="flex:1;">{FREQUENCY_LABELS[f.frequency]}</span>
                      <span style="color:#16a34a;">-{f.discount_percentage}%</span>
                    </label>
                  ))}
                </div>
              )}

              {settings.discounts.length > 0 && (
                <div style={s.fieldset}>
                  <label style={s.label}>Rabat</label>
                  {settings.discounts.map((d) => (
                    <label key={d.id} style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;font-size:0.88rem;">
                      <input
                        type="radio"
                        name="discount"
                        checked={selectedDiscount === d.id}
                        onClick={() => setSelectedDiscount(selectedDiscount === d.id ? null : d.id)}
                        onChange={() => {}}
                        style="width:16px;height:16px;accent-color:#3b82f6;"
                      />
                      <span style="flex:1;">{d.name}</span>
                      <span style="color:#16a34a;">
                        {d.type === "percent" ? `-${d.value}%` : `-${d.value.toLocaleString("da-DK")} kr`}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <button style={s.btn} onClick={() => setStep("action")}>
                Gå videre →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Step: Action ── */}
      {step === "action" && breakdown && (
        <>
          <button style="background:none;border:none;color:#6b7280;font-size:0.83rem;cursor:pointer;padding:0;margin-bottom:12px;" onClick={() => setStep("price")}>
            ← Tilbage
          </button>
          <h2 style={s.h2}>Hvad vil du gøre?</h2>
          <p style="font-size:0.88rem;color:#6b7280;margin-bottom:16px;">
            Din pris: <strong style="color:#111;">{breakdown.total.toLocaleString("da-DK")} kr</strong>
          </p>

          {(["book", "callback", "email"] as ActionType[]).map((a) => (
            <div
              key={a}
              style={s.actionCard + (action === a ? s.actionCardActive : "")}
              onClick={() => setAction(a)}
            >
              <div style="font-weight:700;font-size:0.9rem;margin-bottom:4px;">
                {a === "book" ? "📅 Book tid" : a === "callback" ? "📞 Bliv ringet op" : "📧 Modtag tilbud på email"}
              </div>
              <div style="font-size:0.8rem;color:#6b7280;">
                {a === "book"
                  ? "Vælg en ledig tid direkte i kalenderen"
                  : a === "callback"
                  ? "Vi ringer dig op for at aftale tid"
                  : "Tilbuddet sendes til din email, så du kan gennemgå det"}
              </div>
            </div>
          ))}

          <button
            style={s.btn + (!action ? "opacity:0.5;" : "")}
            disabled={!action}
            onClick={() => action && goToContact(action)}
          >
            Fortsæt →
          </button>
        </>
      )}

      {/* ── Step: Contact ── */}
      {step === "contact" && (
        <>
          <button style="background:none;border:none;color:#6b7280;font-size:0.83rem;cursor:pointer;padding:0;margin-bottom:12px;" onClick={() => setStep("action")}>
            ← Tilbage
          </button>
          <h2 style={s.h2}>Dine oplysninger</h2>

          <div style={s.fieldset}>
            <label style={s.label}>Navn *</label>
            <input style={s.input} type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Dit fulde navn" />
          </div>

          {(action === "email" || action === "book") && (
            <div style={s.fieldset}>
              <label style={s.label}>Email *</label>
              <input style={s.input} type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="din@email.dk" />
            </div>
          )}

          <div style={s.fieldset}>
            <label style={s.label}>Telefon *</label>
            <input style={s.input} type="tel" value={phone} onInput={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="+45 12 34 56 78" />
          </div>

          {action === "book" && slots.length > 0 && (
            <div style={s.fieldset}>
              <label style={s.label}>Vælg tid *</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:200px;overflow-y:auto;">
                {slots.map((slot) => {
                  const d = new Date(slot)
                  const label = d.toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
                  return (
                    <button
                      key={slot}
                      style={`border:2px solid ${selectedSlot === slot ? "#3b82f6" : "#e5e7eb"};background:${selectedSlot === slot ? "#eff6ff" : "#fff"};border-radius:8px;padding:8px;font-size:0.8rem;cursor:pointer;text-align:center;`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {submitError && <p style={s.error}>{submitError}</p>}

          <button
            style={s.btn + ((!name || !phone || (action !== "callback" && !email) || (action === "book" && !selectedSlot) || submitting) ? "opacity:0.5;" : "")}
            disabled={!name || !phone || (action !== "callback" && !email) || (action === "book" && !selectedSlot) || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Sender..." : action === "book" ? "Book tid" : action === "callback" ? "Bliv ringet op" : "Send tilbud"}
          </button>
        </>
      )}

      {/* ── Step: Confirmation ── */}
      {step === "confirmation" && (
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:2.5rem;margin-bottom:12px;">✅</div>
          <h2 style={s.h2}>
            {action === "book" ? "Tak! Din tid er booket." : action === "callback" ? "Tak! Vi ringer dig op." : "Tak! Tilbuddet er sendt."}
          </h2>
          <p style="font-size:0.88rem;color:#6b7280;">
            {action === "book"
              ? "Du vil modtage en bekræftelse på email."
              : action === "callback"
              ? "Vi kontakter dig hurtigst muligt."
              : "Tjek din indbakke for tilbuddet."}
          </p>
        </div>
      )}
    </div>
  )
}
