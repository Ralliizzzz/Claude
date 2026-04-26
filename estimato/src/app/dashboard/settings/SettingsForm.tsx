"use client"

import { useState, useTransition, useRef } from "react"
import type { OpeningHours, DayKey, Location } from "@/types/settings"
import { saveSettings, saveServiceArea, saveContactInfo } from "./actions"

const DAY_LABELS: Record<string, string> = {
  mon: "Mandag",
  tue: "Tirsdag",
  wed: "Onsdag",
  thu: "Torsdag",
  fri: "Fredag",
  sat: "Lørdag",
  sun: "Søndag",
}
const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

const EMPTY_BRANCH: Location = {
  name: "",
  street_address: "",
  postal_code: "",
  city: "",
  country: "Danmark",
  lat: null,
  lon: null,
  max_distance_km: 0,
}

interface Props {
  initialOpeningHours: OpeningHours
  initialMainLocation: Location
  initialBranchLocations: Location[]
  companyId: string
  initialCompanyName: string
  initialEmail: string
  initialPhone: string
}

export default function SettingsForm({
  initialOpeningHours,
  initialMainLocation,
  initialBranchLocations,
  companyId,
  initialCompanyName,
  initialEmail,
  initialPhone,
}: Props) {
  const [openingHours, setOpeningHours] = useState<OpeningHours>(initialOpeningHours)
  const [mainLocation, setMainLocation] = useState<Location>(initialMainLocation)
  const [branches, setBranches] = useState<Location[]>(initialBranchLocations)

  const [savedHours, setSavedHours] = useState(false)
  const [savedArea, setSavedArea] = useState(false)
  const [errorHours, setErrorHours] = useState<string | null>(null)
  const [errorArea, setErrorArea] = useState<string | null>(null)

  const [pendingHours, startHours] = useTransition()
  const [pendingArea, startArea] = useTransition()

  // Contact info
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [contactEmail, setContactEmail] = useState(initialEmail)
  const [contactPhone, setContactPhone] = useState(initialPhone)
  const [savedContact, setSavedContact] = useState(false)
  const [errorContact, setErrorContact] = useState<string | null>(null)
  const [pendingContact, startContact] = useTransition()

  function handleSaveContact() {
    setErrorContact(null)
    startContact(async () => {
      const result = await saveContactInfo(companyName, contactEmail, contactPhone)
      if (result.error) setErrorContact(result.error)
      else setSavedContact(true)
    })
  }

  // ── Opening hours ────────────────────────────────────────────────────────
  function toggleDay(day: DayKey, open: boolean) {
    setOpeningHours((prev) => ({ ...prev, [day]: open ? { open: "08:00", close: "16:00" } : null }))
    setSavedHours(false)
  }
  function updateHour(day: DayKey, field: "open" | "close", value: string) {
    const current = openingHours[day]
    if (!current) return
    setOpeningHours((prev) => ({ ...prev, [day]: { ...current, [field]: value } }))
    setSavedHours(false)
  }
  function handleSaveHours() {
    setErrorHours(null)
    startHours(async () => {
      const result = await saveSettings(openingHours)
      if (result.error) setErrorHours(result.error)
      else setSavedHours(true)
    })
  }

  // ── Service area ─────────────────────────────────────────────────────────
  function addBranch() {
    setBranches((prev) => [...prev, { ...EMPTY_BRANCH }])
    setSavedArea(false)
  }
  function updateBranch(idx: number, updated: Location) {
    setBranches((prev) => prev.map((b, i) => i === idx ? updated : b))
    setSavedArea(false)
  }
  function removeBranch(idx: number) {
    setBranches((prev) => prev.filter((_, i) => i !== idx))
    setSavedArea(false)
  }
  function handleSaveArea() {
    setErrorArea(null)
    startArea(async () => {
      const result = await saveServiceArea(mainLocation, branches)
      if (result.error) setErrorArea(result.error)
      else setSavedArea(true)
    })
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Kontaktoplysninger ── */}
      <Section title="Kontaktoplysninger">
        <p className="text-sm text-gray-500 mb-4">
          Bruges til at sende dig email og SMS, når der kommer nye leads.
        </p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firmanavn</label>
            <input
              type="text"
              className={input}
              value={companyName}
              onChange={(e) => { setCompanyName(e.target.value); setSavedContact(false) }}
              placeholder="Jensens Rengøring ApS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email til notifikationer</label>
            <input
              type="email"
              className={input}
              value={contactEmail}
              onChange={(e) => { setContactEmail(e.target.value); setSavedContact(false) }}
              placeholder="din@email.dk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon til SMS-notifikationer</label>
            <input
              type="tel"
              className={input}
              value={contactPhone}
              onChange={(e) => { setContactPhone(e.target.value); setSavedContact(false) }}
              placeholder="+45 12 34 56 78"
            />
            <p className="text-xs text-gray-400 mt-1">Bruges til SMS når nye leads kommer ind.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={handleSaveContact}
            disabled={pendingContact}
            className="bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            {pendingContact ? "Gemmer..." : "Gem kontaktoplysninger"}
          </button>
          {savedContact && <span className="text-sm text-green-600 font-medium">✓ Gemt</span>}
          {errorContact && <span className="text-sm text-red-500">{errorContact}</span>}
        </div>
      </Section>

      {/* ── Serviceområde ── */}
      <Section title="Serviceområde">
        <p className="text-sm text-gray-500 mb-6">
          Angiv din adresse og den maksimale afstand du kører. Kunder uden for serviceområdet
          kan ikke bestille via widget&apos;en.
        </p>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Primær adresse</p>
        <LocationFields
          loc={mainLocation}
          onUpdate={(updated) => { setMainLocation(updated); setSavedArea(false) }}
          showName={false}
        />

        {branches.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Afdelinger</p>
            {branches.map((b, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-4 mb-3 relative">
                <button
                  onClick={() => removeBranch(idx)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  title="Fjern afdeling"
                >
                  ×
                </button>
                <LocationFields
                  loc={b}
                  onUpdate={(updated) => updateBranch(idx, updated)}
                  showName={true}
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={addBranch}
          className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-1 mt-2"
        >
          + Tilføj afdeling
        </button>

        <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={handleSaveArea}
            disabled={pendingArea}
            className="bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            {pendingArea ? "Gemmer..." : "Gem serviceområde"}
          </button>
          {savedArea && <span className="text-sm text-green-600 font-medium">✓ Gemt</span>}
          {errorArea && <span className="text-sm text-red-500">{errorArea}</span>}
        </div>
      </Section>

      {/* ── Åbningstider ── */}
      <Section title="Åbningstider">
        <p className="text-sm text-gray-500 mb-4">
          Kunder kan kun booke tider inden for dit åbningstidsinterval.
        </p>
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => {
            const hours = openingHours[day]
            const isOpen = hours !== null
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`day-${day}`}
                    checked={isOpen}
                    onChange={(e) => toggleDay(day, e.target.checked)}
                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className={`text-sm font-medium cursor-pointer select-none ${isOpen ? "text-gray-800" : "text-gray-400"}`}
                  >
                    {DAY_LABELS[day]}
                  </label>
                </div>
                {isOpen ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" className={`${input} w-28 text-sm`} value={hours!.open} onChange={(e) => updateHour(day, "open", e.target.value)} />
                    <span className="text-gray-400">–</span>
                    <input type="time" className={`${input} w-28 text-sm`} value={hours!.close} onChange={(e) => updateHour(day, "close", e.target.value)} />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Lukket</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={handleSaveHours}
            disabled={pendingHours}
            className="bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
          >
            {pendingHours ? "Gemmer..." : "Gem åbningstider"}
          </button>
          {savedHours && <span className="text-sm text-green-600 font-medium">✓ Gemt</span>}
          {errorHours && <span className="text-sm text-red-500">{errorHours}</span>}
        </div>
      </Section>

      {/* ── Embed-kode ── */}
      <Section title="Embed-kode">
        <p className="text-sm text-gray-500 mb-3">
          Indsæt denne kode på din hjemmeside for at vise prisberegner-widget&apos;en.
        </p>
        <EmbedCode companyId={companyId} />
      </Section>
    </div>
  )
}

// ── LocationFields med DAWA-autocomplete ─────────────────────────────────────

function LocationFields({
  loc,
  onUpdate,
  showName,
}: {
  loc: Location
  onUpdate: (updated: Location) => void
  showName: boolean
}) {
  const [query, setQuery] = useState(loc.street_address || "")
  const [suggestions, setSuggestions] = useState<{ text: string; id: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const geocoded = !!(loc.lat && loc.lon)

  async function onInput(val: string) {
    setQuery(val)
    // Nulstil geocoding når brugeren retter adressen
    onUpdate({ ...loc, street_address: val, lat: null, lon: null })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bbr?mode=autocomplete&q=${encodeURIComponent(val)}`)
        if (!res.ok) return
        const data: { text: string; id: string }[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch { /* ignore */ }
    }, 300)
  }

  async function onSelect(s: { text: string; id: string }) {
    setQuery(s.text)
    setSuggestions([])
    setShowSuggestions(false)
    setGeocoding(true)
    try {
      const res = await fetch(`/api/bbr?mode=lookup&id=${s.id}`)
      if (res.ok) {
        const data: { lat: number | null; lon: number | null } = await res.json()
        onUpdate({ ...loc, street_address: s.text, lat: data.lat, lon: data.lon })
      } else {
        onUpdate({ ...loc, street_address: s.text, lat: null, lon: null })
      }
    } catch {
      onUpdate({ ...loc, street_address: s.text, lat: null, lon: null })
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {showName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Navn på afdeling</label>
          <input
            type="text"
            className={input}
            value={loc.name}
            onChange={(e) => onUpdate({ ...loc, name: e.target.value })}
            placeholder="F.eks. København, Aarhus"
          />
        </div>
      )}

      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setShowSuggestions(false), 150)
          }
        }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <div className="relative">
          <input
            type="text"
            className={input}
            value={query}
            onChange={(e) => onInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Begynd at taste adresse..."
            autoComplete="off"
          />
          {geocoded && !geocoding && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium pointer-events-none">
              ✓ Fundet
            </span>
          )}
          {geocoding && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              Henter...
            </span>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0"
                onMouseDown={() => onSelect(s)}
              >
                {s.text}
              </div>
            ))}
          </div>
        )}
        {!geocoded && !geocoding && query.length > 0 && (
          <p className="text-xs text-amber-500 mt-1">Vælg en adresse fra listen for at aktivere afstandsbegrænsning.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Maks. afstand (km)</label>
        <input
          type="number"
          min="0"
          className={input}
          value={loc.max_distance_km ?? ""}
          onChange={(e) => onUpdate({ ...loc, max_distance_km: Number(e.target.value) })}
          placeholder="F.eks. 30"
        />
        <p className="text-xs text-gray-400 mt-1">
          Sæt til 0 for ingen begrænsning.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function EmbedCode({ companyId }: { companyId: string }) {
  const [copied, setCopied] = useState(false)
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato.dk"

  const code = `<script src="${appUrl}/widget.js" data-company="${companyId}"></script>\n<div id="lead-widget"></div>`

  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors font-medium"
      >
        {copied ? "Kopieret ✓" : "Kopiér"}
      </button>
    </div>
  )
}

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
