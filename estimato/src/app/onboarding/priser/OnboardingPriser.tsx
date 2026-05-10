"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import WizardShell from "../WizardShell"
import { savePriser } from "@/app/dashboard/priser/actions"
import type { IntervalRange, TransportFee } from "@/types/settings"

interface Props {
  initialPricingType: "sqm" | "interval"
  initialPricePerSqm: number | null
  initialIntervalRanges: IntervalRange[]
  initialMinimumPrice: number | null
  initialTransportFee: TransportFee
}

export default function OnboardingPriser({
  initialPricingType,
  initialPricePerSqm,
  initialIntervalRanges,
  initialMinimumPrice,
  initialTransportFee,
}: Props) {
  const router = useRouter()
  const [pricingType, setPricingType] = useState<"sqm" | "interval">(initialPricingType)
  const [pricePerSqm, setPricePerSqm] = useState(initialPricePerSqm?.toString() ?? "")
  const [intervalRanges, setIntervalRanges] = useState<IntervalRange[]>(
    initialIntervalRanges.length > 0 ? initialIntervalRanges : [{ min: 0, max: 100, price_per_m2: 0 }]
  )
  const [minimumPrice, setMinimumPrice] = useState(initialMinimumPrice?.toString() ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addRange() {
    const last = intervalRanges[intervalRanges.length - 1]
    setIntervalRanges([...intervalRanges, { min: last ? last.max + 1 : 0, max: last ? last.max + 50 : 50, price_per_m2: 0 }])
  }

  function removeRange(i: number) {
    setIntervalRanges(intervalRanges.filter((_, idx) => idx !== i))
  }

  function updateRange(i: number, field: keyof IntervalRange, value: string) {
    setIntervalRanges(intervalRanges.map((r, idx) => idx === i ? { ...r, [field]: Number(value) } : r))
  }

  async function handleNext() {
    setSaving(true)
    setError(null)
    const result = await savePriser({
      pricing_type: pricingType,
      price_per_sqm: pricingType === "sqm" ? (Number(pricePerSqm) || null) : null,
      interval_ranges: pricingType === "interval" ? intervalRanges : [],
      flat_ranges: [],
      add_ons: [],
      discounts: [],
      minimum_price: minimumPrice ? Number(minimumPrice) : null,
      frequency_discounts: [],
      transport_fee: initialTransportFee,
    })
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    router.push("/onboarding/adresse")
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <WizardShell
      step={1}
      title="Sæt dine priser"
      subtitle="Vælg prismodel og udfyld dine satser. Du kan altid justere dem senere."
      onNext={handleNext}
      saving={saving}
    >
      {/* Prismodel */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prismodel</label>
        <div className="grid grid-cols-2 gap-3">
          {(["sqm", "interval"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPricingType(type)}
              className={`border rounded-xl px-4 py-3 text-sm font-semibold text-left transition-colors ${
                pricingType === type
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold mb-0.5">{type === "sqm" ? "Pris pr. m²" : "Intervalpriser"}</div>
              <div className="text-xs font-normal text-gray-500">
                {type === "sqm" ? "Fast sats ganget med m²" : "Forskellig pris per størrelse"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pris pr. m² */}
      {pricingType === "sqm" && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pris pr. m² (kr)</label>
          <input
            type="number"
            min={0}
            className={inp}
            placeholder="f.eks. 12"
            value={pricePerSqm}
            onChange={(e) => setPricePerSqm(e.target.value)}
          />
        </div>
      )}

      {/* Intervalpriser */}
      {pricingType === "interval" && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prisintervaller</label>
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
              <span className="text-xs font-semibold text-gray-500">Fra m²</span>
              <span className="text-xs font-semibold text-gray-500">Til m²</span>
              <span className="text-xs font-semibold text-gray-500">Kr/m²</span>
              <span />
            </div>
            {intervalRanges.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-3 py-2 border-b border-gray-100 last:border-0 items-center">
                <input type="number" min={0} className={inp} value={r.min} onChange={(e) => updateRange(i, "min", e.target.value)} />
                <input type="number" min={0} className={inp} value={r.max} onChange={(e) => updateRange(i, "max", e.target.value)} />
                <input type="number" min={0} className={inp} value={r.price_per_m2} onChange={(e) => updateRange(i, "price_per_m2", e.target.value)} />
                <button
                  type="button"
                  onClick={() => removeRange(i)}
                  disabled={intervalRanges.length === 1}
                  className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRange}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Tilføj interval
          </button>
        </div>
      )}

      {/* Minimumspris */}
      <div className="mb-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Minimumspris <span className="font-normal text-gray-400">(valgfrit)</span>
        </label>
        <input
          type="number"
          min={0}
          className={inp}
          placeholder="f.eks. 500"
          value={minimumPrice}
          onChange={(e) => setMinimumPrice(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1.5">Laveste pris uanset m² — efterlad tom for ingen grænse.</p>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
      )}
    </WizardShell>
  )
}
