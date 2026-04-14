"use client"

import { useState, useTransition } from "react"
import type { AddOn, Discount, IntervalRange, FlatRange } from "@/types/settings"
import { savePriser, type PriserData } from "./actions"

interface Props {
  initialData: PriserData
}

export default function PriserForm({ initialData }: Props) {
  const [data, setData] = useState<PriserData>(initialData)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof PriserData>(key: K, value: PriserData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const result = await savePriser(data)
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  // ── Tilvalg ────────────────────────────────────────────────────────────────
  function addAddOn() {
    update("add_ons", [...data.add_ons, { id: crypto.randomUUID(), name: "", price: 0 }])
  }
  function updateAddOn(id: string, field: keyof AddOn, value: string | number) {
    update("add_ons", data.add_ons.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }
  function removeAddOn(id: string) {
    update("add_ons", data.add_ons.filter((a) => a.id !== id))
  }

  // ── Rabatter ───────────────────────────────────────────────────────────────
  function addDiscount() {
    update("discounts", [
      ...data.discounts,
      { id: crypto.randomUUID(), name: "", type: "percent" as const, value: 10 },
    ])
  }
  function updateDiscount(id: string, field: keyof Discount, value: string | number) {
    update("discounts", data.discounts.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }
  function removeDiscount(id: string) {
    update("discounts", data.discounts.filter((d) => d.id !== id))
  }

  // ── Pris pr. m² intervaller ────────────────────────────────────────────────
  function addRange() {
    const last = data.interval_ranges.at(-1)
    const newRange: IntervalRange = {
      min: last ? last.max + 1 : 0,
      max: last ? last.max + 20 : 20,
      price_per_m2: 0,
    }
    update("interval_ranges", [...data.interval_ranges, newRange])
  }
  function updateRange(idx: number, field: keyof IntervalRange, value: number) {
    update("interval_ranges", data.interval_ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  function removeRange(idx: number) {
    update("interval_ranges", data.interval_ranges.filter((_, i) => i !== idx))
  }

  // ── Pris i alt intervaller ─────────────────────────────────────────────────
  function addFlatRange() {
    const last = data.flat_ranges.at(-1)
    const newRange: FlatRange = {
      min: last ? last.max + 1 : 0,
      max: last ? last.max + 20 : 20,
      price: 0,
    }
    update("flat_ranges", [...data.flat_ranges, newRange])
  }
  function updateFlatRange(idx: number, field: keyof FlatRange, value: number) {
    update("flat_ranges", data.flat_ranges.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  function removeFlatRange(idx: number) {
    update("flat_ranges", data.flat_ranges.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── 1. Prismodel ── */}
      <Section title="Prismodel">
        <div className="flex gap-2 mb-4">
          {(["interval", "sqm"] as const).map((type) => (
            <button
              key={type}
              onClick={() => update("pricing_type", type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                data.pricing_type === type
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {type === "sqm" ? "Pris i alt" : "Pris pr. m²"}
            </button>
          ))}
        </div>

        {data.pricing_type === "sqm" && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Angiv en fast pris for hver størrelsesinterval. F.eks. 0–50 m² → 200 kr i alt.
            </p>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Fra (m²)</span>
              <span>Til (m²)</span>
              <span>Pris i alt (kr)</span>
              <span />
            </div>
            {data.flat_ranges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.min}
                  onChange={(e) => updateFlatRange(idx, "min", Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.max}
                  onChange={(e) => updateFlatRange(idx, "max", Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.price}
                  onChange={(e) => updateFlatRange(idx, "price", Number(e.target.value))}
                />
                <button
                  onClick={() => removeFlatRange(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
                  title="Fjern"
                >
                  ×
                </button>
              </div>
            ))}
            <button onClick={addFlatRange} className={btnSecondary}>
              + Tilføj interval
            </button>
          </div>
        )}

        {data.pricing_type === "interval" && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Angiv en pris pr. m² for hver størrelsesinterval. Den endelige pris = areal × pris pr. m².
            </p>
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Fra (m²)</span>
              <span>Til (m²)</span>
              <span>Pris pr. m² (kr)</span>
              <span />
            </div>
            {data.interval_ranges.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.min}
                  onChange={(e) => updateRange(idx, "min", Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.max}
                  onChange={(e) => updateRange(idx, "max", Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={r.price_per_m2}
                  onChange={(e) => updateRange(idx, "price_per_m2", Number(e.target.value))}
                />
                <button
                  onClick={() => removeRange(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
                  title="Fjern"
                >
                  ×
                </button>
              </div>
            ))}
            <button onClick={addRange} className={btnSecondary}>
              + Tilføj interval
            </button>
          </div>
        )}

        <Field label="Minimumspris (kr, valgfri)" className="mt-4">
          <input
            type="number"
            min="0"
            className={input}
            value={data.minimum_price ?? ""}
            onChange={(e) =>
              update("minimum_price", e.target.value ? Number(e.target.value) : null)
            }
            placeholder="F.eks. 300"
          />
          <p className="text-xs text-gray-400 mt-1">
            Prisen vises aldrig lavere end dette beløb i widget&apos;en.
          </p>
        </Field>
      </Section>

      {/* ── 2. Tilvalg ── */}
      <Section title="Tilvalg">
        <p className="text-sm text-gray-500 mb-3">
          Ekstra ydelser kunden kan vælge til. Vises i widget&apos;en efter prisberegningen.
        </p>
        {data.add_ons.length > 0 && (
          <div className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Navn</span>
            <span>Pris (kr)</span>
            <span />
          </div>
        )}
        {data.add_ons.map((a) => (
          <div key={a.id} className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2">
            <input
              type="text"
              className={input}
              value={a.name}
              onChange={(e) => updateAddOn(a.id, "name", e.target.value)}
              placeholder="F.eks. Vinduespolering"
            />
            <input
              type="number"
              min="0"
              className={input}
              value={a.price}
              onChange={(e) => updateAddOn(a.id, "price", Number(e.target.value))}
            />
            <button
              onClick={() => removeAddOn(a.id)}
              className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={addAddOn} className={btnSecondary}>
          + Tilføj tilvalg
        </button>
      </Section>

      {/* ── 3. Rabatter ── */}
      <Section title="Rabatter">
        <p className="text-sm text-gray-500 mb-3">
          Rabatter kunden kan vælge i widget&apos;en (f.eks. tilbagevendende kunde).
        </p>
        {data.discounts.length > 0 && (
          <div className="grid grid-cols-[1fr_130px_100px_auto] gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Navn</span>
            <span>Type</span>
            <span>Værdi</span>
            <span />
          </div>
        )}
        {data.discounts.map((d) => (
          <div key={d.id} className="grid grid-cols-[1fr_130px_100px_auto] gap-2 mb-2">
            <input
              type="text"
              className={input}
              value={d.name}
              onChange={(e) => updateDiscount(d.id, "name", e.target.value)}
              placeholder="F.eks. Tilbagevendende kunde"
            />
            <select
              className={input}
              value={d.type}
              onChange={(e) => updateDiscount(d.id, "type", e.target.value)}
            >
              <option value="percent">Procent (%)</option>
              <option value="fixed">Fast beløb (kr)</option>
            </select>
            <div className="relative">
              <input
                type="number"
                min="0"
                className={input}
                value={d.value}
                onChange={(e) => updateDiscount(d.id, "value", Number(e.target.value))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                {d.type === "percent" ? "%" : "kr"}
              </span>
            </div>
            <button
              onClick={() => removeDiscount(d.id)}
              className="text-gray-300 hover:text-red-400 transition-colors px-2 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={addDiscount} className={btnSecondary}>
          + Tilføj rabat
        </button>
      </Section>

      {/* ── Gem-knap ── */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {isPending ? "Gemmer..." : "Gem priser"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Gemt — widget opdateres inden for 60 sek.
          </span>
        )}
        {saveError && (
          <span className="text-sm text-red-500">{saveError}</span>
        )}
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

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

const btnSecondary =
  "text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors py-1"
