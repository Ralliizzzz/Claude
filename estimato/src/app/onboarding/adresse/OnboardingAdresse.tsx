"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import WizardShell from "../WizardShell"
import { saveServiceArea } from "@/app/dashboard/settings/actions"
import type { Location } from "@/types/settings"

interface Props {
  initialLocation: Location
  companyName: string
}

export default function OnboardingAdresse({ initialLocation, companyName }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialLocation.name || companyName)
  const [streetAddress, setStreetAddress] = useState(initialLocation.street_address)
  const [postalCode, setPostalCode] = useState(initialLocation.postal_code)
  const [city, setCity] = useState(initialLocation.city)
  const [maxDistance, setMaxDistance] = useState(
    initialLocation.max_distance_km > 0 ? initialLocation.max_distance_km.toString() : ""
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNext() {
    setSaving(true)
    setError(null)
    const location: Location = {
      name,
      street_address: streetAddress,
      postal_code: postalCode,
      city,
      country: "Danmark",
      lat: initialLocation.lat,
      lon: initialLocation.lon,
      max_distance_km: maxDistance ? Number(maxDistance) : 0,
    }
    const result = await saveServiceArea(location, [])
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    router.push("/onboarding/aabningstider")
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <WizardShell
      step={2}
      title="Din virksomhedsadresse"
      subtitle="Bruges til at beregne køreafstand til kunder. Du kan tilføje flere afdelinger later."
      onNext={handleNext}
      saving={saving}
      backHref="/onboarding/priser"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Afdelingsnavn</label>
          <input
            type="text"
            className={inp}
            placeholder="Hovedkontor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Adresse</label>
          <input
            type="text"
            className={inp}
            placeholder="Eksempelvej 1"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Postnr.</label>
            <input
              type="text"
              className={inp}
              placeholder="8000"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By</label>
            <input
              type="text"
              className={inp}
              placeholder="Aarhus"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Maks. køreafstand <span className="font-normal text-gray-400">(km, valgfrit)</span>
          </label>
          <input
            type="number"
            min={0}
            className={inp}
            placeholder="f.eks. 30 — efterlad tom for ingen grænse"
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1.5">Kunder uden for dette område vil ikke kunne bruge beregneren.</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
      )}
    </WizardShell>
  )
}
