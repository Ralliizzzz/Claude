"use client"

import { useState } from "react"
import { bulkImportProspects } from "../../actions"

interface CvrCompany {
  cvrNumber: string
  companyName: string
  address: string
  city: string
  postalCode: string
  phone: string | null
  email: string | null
  alreadyImported: boolean
}

export default function CvrImportButton() {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState("")
  const [limit, setLimit] = useState(50)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<CvrCompany[] | null>(null)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastImportCount, setLastImportCount] = useState(0)

  async function handleSearch() {
    setSearching(true)
    setError(null)
    setResults(null)
    setSelected(new Set())
    try {
      const res = await fetch("/api/admin/cvr-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim() || undefined, limit }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Fejl ${res.status}`)
      const companies: CvrCompany[] = data.companies
      setResults(companies)
      setTotal(data.total ?? companies.length)
      const autoSelect = new Set<string>()
      companies.forEach((c) => { if (!c.alreadyImported) autoSelect.add(c.cvrNumber) })
      setSelected(autoSelect)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
    } finally {
      setSearching(false)
    }
  }

  function toggleSelect(cvrNumber: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cvrNumber)) next.delete(cvrNumber)
      else next.add(cvrNumber)
      return next
    })
  }

  function toggleAll() {
    const eligible = (results ?? []).filter((c) => !c.alreadyImported).map((c) => c.cvrNumber)
    setSelected(selected.size === eligible.length ? new Set() : new Set(eligible))
  }

  async function handleImport() {
    if (!results || selected.size === 0) return
    const toImport = results.filter((c) => selected.has(c.cvrNumber))
    setImporting(true)
    setError(null)
    try {
      await bulkImportProspects(
        toImport.map((c) => ({
          companyName: c.companyName,
          city: c.city || undefined,
          phone: c.phone ?? undefined,
          email: c.email ?? undefined,
          cvrNumber: c.cvrNumber,
        }))
      )
      setLastImportCount(toImport.length)
      setResults(null)
      setSelected(new Set())
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl ved import")
    } finally {
      setImporting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        Find CVR-leads
        {lastImportCount > 0 && (
          <span className="bg-white/20 rounded-full px-2 text-xs">{lastImportCount} importeret</span>
        )}
      </button>
    )
  }

  const eligible = (results ?? []).filter((c) => !c.alreadyImported)
  const alreadyCount = (results ?? []).filter((c) => c.alreadyImported).length

  return (
    <div className="bg-white border border-blue-100 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Find rengøringsfirmaer fra CVR-registret</h2>
        <button onClick={() => { setOpen(false); setResults(null) }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">By (valgfrit)</label>
          <input
            type="text"
            placeholder="f.eks. KØBENHAVN"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400 w-44"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Antal</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="text-sm bg-gray-900 text-white rounded-lg px-4 py-1.5 hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {searching ? "Søger..." : "Søg i CVR"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {results && (
        <>
          <div className="border border-gray-100 rounded-lg overflow-hidden mb-3 max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={eligible.length > 0 && selected.size === eligible.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">CVR</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Firma</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">By</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Telefon</th>
                  <th className="px-3 py-2 text-left text-gray-500 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {results.map((company) => (
                  <tr
                    key={company.cvrNumber}
                    className={`border-b border-gray-50 ${company.alreadyImported ? "opacity-40" : "hover:bg-gray-50 cursor-pointer"}`}
                    onClick={() => !company.alreadyImported && toggleSelect(company.cvrNumber)}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(company.cvrNumber)}
                        disabled={company.alreadyImported}
                        onChange={() => toggleSelect(company.cvrNumber)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-400">{company.cvrNumber}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {company.companyName}
                      {company.alreadyImported && <span className="ml-1 text-gray-400 font-normal">(allerede tilføjet)</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{company.city} {company.postalCode}</td>
                    <td className="px-3 py-2 text-gray-500">{company.phone ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{company.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {importing ? "Importerer..." : `Importer valgte (${selected.size})`}
            </button>
            <span className="text-xs text-gray-400">
              {results.length} vist af {total} fundet
              {alreadyCount > 0 && ` · ${alreadyCount} allerede importeret`}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
