"use client"

import { useState } from "react"
import { updateProspectStatus, updateProspectNotes, deleteProspect } from "../../actions"
import type { ProspectStatus } from "@/types/database"

const STATUS_OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: "not_contacted", label: "Ikke kontaktet" },
  { value: "contacted", label: "Kontaktet" },
  { value: "demo_scheduled", label: "Demo aftalt" },
  { value: "converted", label: "Konverteret" },
  { value: "declined", label: "Takket nej" },
]

export default function ProspectActions({
  prospectId,
  currentStatus,
  currentNotes,
}: {
  prospectId: string
  currentStatus: ProspectStatus
  currentNotes: string | null
}) {
  const [notes, setNotes] = useState(currentNotes ?? "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [settingStatus, setSettingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notesChanged, setNotesChanged] = useState(false)

  async function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as ProspectStatus
    setSettingStatus(true)
    setError(null)
    try {
      await updateProspectStatus(prospectId, status)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
    } finally {
      setSettingStatus(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    setError(null)
    try {
      await updateProspectNotes(prospectId, notes)
      setNotesChanged(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Slet dette prospect?")) return
    setDeleting(true)
    setError(null)
    try {
      await deleteProspect(prospectId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fejl")
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <select
        defaultValue={currentStatus}
        onChange={handleStatus}
        disabled={settingStatus}
        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="flex gap-1">
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesChanged(true) }}
          rows={2}
          placeholder="Noter..."
          className="text-xs border border-gray-200 rounded px-1.5 py-1 flex-1 resize-none"
        />
        {notesChanged && (
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {savingNotes ? "..." : "Gem"}
          </button>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 text-left"
      >
        {deleting ? "Sletter..." : "Slet"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
