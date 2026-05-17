import { createServiceClient } from "@/lib/supabase/server"
import type { ProspectRow } from "@/types/database"
import AddProspectForm from "./AddProspectForm"
import ProspectActions from "./ProspectActions"
import CvrImportButton from "./CvrImportButton"

const STATUS_LABELS: Record<string, string> = {
  not_contacted: "Ikke kontaktet",
  contacted: "Kontaktet",
  demo_scheduled: "Demo aftalt",
  converted: "Konverteret",
  declined: "Takket nej",
}

const STATUS_COLORS: Record<string, string> = {
  not_contacted: "bg-gray-100 text-gray-500",
  contacted: "bg-blue-50 text-blue-700",
  demo_scheduled: "bg-amber-50 text-amber-700",
  converted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-600",
}

export default async function ProspectsPage() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false })

  const rows: ProspectRow[] = (data as ProspectRow[]) ?? []

  const total = rows.length
  const contacted = rows.filter((r) => r.status === "contacted").length
  const demo = rows.filter((r) => r.status === "demo_scheduled").length
  const converted = rows.filter((r) => r.status === "converted").length

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Prospects</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Prospects i alt", value: total },
          { label: "Kontaktet", value: contacted },
          { label: "Demo aftalt", value: demo },
          { label: "Konverteret", value: converted },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <CvrImportButton />
      <AddProspectForm />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Firma</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kontakt</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tlf</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">By</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kilde</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Sidst kontaktet</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((prospect) => (
              <tr key={prospect.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {prospect.website ? (
                    <a
                      href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {prospect.company_name}
                    </a>
                  ) : (
                    prospect.company_name
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{prospect.contact_name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {prospect.email ? (
                    <a href={`mailto:${prospect.email}`} className="hover:underline">{prospect.email}</a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{prospect.phone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{prospect.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[prospect.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[prospect.status] ?? prospect.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{prospect.source ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {prospect.last_contacted_at
                    ? new Date(prospect.last_contacted_at).toLocaleDateString("da-DK")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <ProspectActions
                    prospectId={prospect.id}
                    currentStatus={prospect.status}
                    currentNotes={prospect.notes}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Ingen prospects endnu — tilføj dit første ovenfor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
