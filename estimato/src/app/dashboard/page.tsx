import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { LeadRow } from "@/types/database";
import { DashboardCharts } from "./DashboardCharts";

type LeadForCharts = Pick<LeadRow, "created_at" | "status">;

function computeWeeklyData(leads: LeadForCharts[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Monday of current week
  const dow = now.getDay();
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));

  // 8 buckets going back 7 weeks
  const keys: number[] = [];
  const labels: Record<number, string> = {};
  for (let i = 7; i >= 0; i--) {
    const monday = new Date(currentMonday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const key = monday.getTime();
    keys.push(key);
    labels[key] = `${monday.getDate()}/${monday.getMonth() + 1}`;
  }

  const counts: Record<number, number> = Object.fromEntries(keys.map((k) => [k, 0]));

  for (const lead of leads) {
    const d = new Date(lead.created_at);
    d.setHours(0, 0, 0, 0);
    const ldow = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (ldow === 0 ? 6 : ldow - 1));
    monday.setHours(0, 0, 0, 0);
    const key = monday.getTime();
    if (key in counts) counts[key]++;
  }

  return keys.map((k) => ({ week: labels[k], antal: counts[k] }));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [leadsCountResult, bookingsCountResult, newLeadsCountResult, recentLeadsResult, chartsLeadsResult] =
    await Promise.all([
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user!.id),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user!.id),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user!.id)
        .eq("status", "new"),
      supabase
        .from("leads")
        .select("id, name, address, price, status, action_type, created_at")
        .eq("company_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("leads")
        .select("created_at, status")
        .eq("company_id", user!.id)
        .order("created_at", { ascending: true }),
    ]);

  const leadsCount = leadsCountResult.count ?? 0;
  const bookingsCount = bookingsCountResult.count ?? 0;
  const newLeadsCount = newLeadsCountResult.count ?? 0;
  const recentLeads = recentLeadsResult.data as Pick<
    LeadRow,
    "id" | "name" | "address" | "price" | "status" | "action_type" | "created_at"
  >[] | null;
  const hasLeads = leadsCount > 0;

  const chartsLeads = (chartsLeadsResult.data ?? []) as LeadForCharts[];
  const weeklyData = computeWeeklyData(chartsLeads);
  const statusData = [
    { name: "Ny", value: chartsLeads.filter((l) => l.status === "new").length, color: "#3B82F6" },
    { name: "Kontaktet", value: chartsLeads.filter((l) => l.status === "contacted").length, color: "#F59E0B" },
    { name: "Booket", value: chartsLeads.filter((l) => l.status === "booked").length, color: "#10B981" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Oversigt</h1>
        <p className="text-gray-500 text-sm mt-1">Her er et overblik over din aktivitet.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Leads i alt"
          value={leadsCount}
          color="text-blue-600 bg-blue-50"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Bookinger"
          value={bookingsCount}
          color="text-emerald-600 bg-emerald-50"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Nye leads"
          value={newLeadsCount}
          color="text-amber-600 bg-amber-50"
          highlight={newLeadsCount > 0}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
        />
      </div>

      {/* Empty state */}
      {!hasLeads && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Installer din prisberegner</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Du har ingen leads endnu. Installer widget&#39;en på din hjemmeside for at begynde at modtage forespørgsler automatisk.
          </p>
          <Link
            href="/dashboard/embed"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
            Se installationsvejledning
          </Link>
        </div>
      )}

      {/* Charts + recent leads */}
      {hasLeads && (
        <>
          <DashboardCharts weeklyData={weeklyData} statusData={statusData} />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Seneste leads</h2>
              <Link
                href="/dashboard/leads"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Se alle →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentLeads?.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{lead.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900 text-sm">
                      {lead.price.toLocaleString("da-DK")} kr
                    </p>
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-xl px-5 py-4 flex items-center gap-4 ${
        highlight ? "border-amber-200 bg-amber-50/30" : "border-gray-100"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "Ny",
    contacted: "Kontaktet",
    booked: "Booket",
  };
  const colors: Record<string, string> = {
    new: "bg-blue-50 text-blue-600",
    contacted: "bg-amber-50 text-amber-600",
    booked: "bg-emerald-50 text-emerald-600",
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {map[status] ?? status}
    </span>
  );
}
