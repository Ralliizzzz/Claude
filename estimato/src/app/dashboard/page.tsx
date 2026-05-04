import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { LeadRow } from "@/types/database";
import { PeriodSelector } from "./PeriodSelector";
import { DashboardCharts, type TimelinePoint, type FunnelItem } from "./DashboardCharts";

type LeadForCharts = { created_at: string; status: string; price: number };

function getDateRange(period: string, customFrom?: string, customTo?: string) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  if (customFrom && customTo) {
    return {
      startDate: new Date(customFrom + "T00:00:00"),
      endDate: new Date(customTo + "T23:59:59"),
    };
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case "7d":   startDate.setDate(startDate.getDate() - 6); break;
    case "30d":  startDate.setDate(startDate.getDate() - 29); break;
    case "90d":  startDate.setDate(startDate.getDate() - 89); break;
    case "180d": startDate.setDate(startDate.getDate() - 179); break;
    case "365d": startDate.setDate(startDate.getDate() - 364); break;
    case "all":  startDate.setFullYear(2000); break;
    default:     startDate.setDate(startDate.getDate() - 29); break;
  }

  return { startDate, endDate };
}

function groupByDay(leads: LeadForCharts[], start: Date, end: Date): TimelinePoint[] {
  const result: TimelinePoint[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);

  while (cur <= end) {
    const dayStr = cur.toISOString().slice(0, 10);
    const antal = leads.filter((l) => l.created_at.slice(0, 10) === dayStr).length;
    result.push({ label: `${cur.getDate()}/${cur.getMonth() + 1}`, antal });
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

function groupByWeek(leads: LeadForCharts[], start: Date, end: Date): TimelinePoint[] {
  const result: TimelinePoint[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const dow = cur.getDay();
  cur.setDate(cur.getDate() - (dow === 0 ? 6 : dow - 1));

  while (cur <= end) {
    const weekEnd = new Date(cur.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    const antal = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= cur && d <= weekEnd;
    }).length;
    result.push({ label: `${cur.getDate()}/${cur.getMonth() + 1}`, antal });
    cur.setDate(cur.getDate() + 7);
  }

  return result;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function groupByMonth(leads: LeadForCharts[], start: Date, end: Date): TimelinePoint[] {
  const result: TimelinePoint[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59);
    const antal = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= cur && d <= monthEnd;
    }).length;
    result.push({ label: MONTHS[cur.getMonth()], antal });
    cur.setMonth(cur.getMonth() + 1);
  }

  return result;
}

function computeTimelineData(leads: LeadForCharts[], start: Date, end: Date): TimelinePoint[] {
  if (leads.length === 0) return [];
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 31) return groupByDay(leads, start, end);
  if (diffDays <= 200) return groupByWeek(leads, start, end);
  return groupByMonth(leads, start, end);
}

function formatTimeSaved(minutes: number): string {
  if (minutes === 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} timer`;
  return `${h} t ${m} min`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = params.period ?? "30d";
  const customFrom = params.from;
  const customTo = params.to;

  const { startDate, endDate } = getDateRange(period, customFrom, customTo);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [totalCountResult, periodLeadsResult, recentLeadsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("company_id", user!.id),
    supabase
      .from("leads")
      .select("created_at, status, price")
      .eq("company_id", user!.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name, address, price, status, action_type, created_at")
      .eq("company_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const hasLeads = (totalCountResult.count ?? 0) > 0;
  const periodLeads = (periodLeadsResult.data ?? []) as LeadForCharts[];
  const recentLeads = recentLeadsResult.data as Pick<
    LeadRow,
    "id" | "name" | "address" | "price" | "status" | "action_type" | "created_at"
  >[] | null;

  // KPIs
  const leadsInPeriod = periodLeads.length;
  const bookedCount = periodLeads.filter((l) => l.status === "booked").length;
  const conversionRate = leadsInPeriod > 0 ? Math.round((bookedCount / leadsInPeriod) * 100) : 0;
  const minutesSaved = leadsInPeriod * 20;
  const totalQuoteValue = periodLeads.reduce((sum, l) => sum + (l.price ?? 0), 0);

  // Charts
  const chartStart =
    period === "all" && periodLeads.length > 0
      ? new Date(periodLeads[0].created_at)
      : startDate;

  const timelineData = computeTimelineData(periodLeads, chartStart, endDate);

  const atLeastContacted = periodLeads.filter(
    (l) => l.status === "contacted" || l.status === "booked"
  ).length;

  const funnelData: FunnelItem[] = [
    { label: "Modtaget", count: leadsInPeriod, pct: 100, color: "#3B82F6" },
    {
      label: "Kontaktet",
      count: atLeastContacted,
      pct: leadsInPeriod > 0 ? Math.round((atLeastContacted / leadsInPeriod) * 100) : 0,
      color: "#F59E0B",
    },
    {
      label: "Booket",
      count: bookedCount,
      pct: leadsInPeriod > 0 ? Math.round((bookedCount / leadsInPeriod) * 100) : 0,
      color: "#10B981",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oversigt</h1>
          <p className="text-gray-500 text-sm mt-1">Her er et overblik over din aktivitet.</p>
        </div>
        {hasLeads && (
          <PeriodSelector
            activePeriod={period}
            activeFrom={customFrom}
            activeTo={customTo}
          />
        )}
      </div>

      {/* KPI cards */}
      {hasLeads && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Leads"
            value={leadsInPeriod.toString()}
            sub="i perioden"
            type="leads"
          />
          <KpiCard
            label="Konvertering"
            value={`${conversionRate}%`}
            sub={`${bookedCount} booket`}
            type="conversion"
          />
          <KpiCard
            label="Tidssparet"
            value={formatTimeSaved(minutesSaved)}
            sub="ved 20 min/lead"
            type="time"
          />
          <KpiCard
            label="Tilbudsværdi"
            value={`${totalQuoteValue.toLocaleString("da-DK")} kr`}
            sub="samlet i perioden"
            type="value"
          />
        </div>
      )}

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
          <DashboardCharts timelineData={timelineData} funnelData={funnelData} />

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

function KpiCard({
  label,
  value,
  sub,
  type,
}: {
  label: string;
  value: string;
  sub: string;
  type: "leads" | "conversion" | "time" | "value";
}) {
  const colorMap = {
    leads: "text-blue-600 bg-blue-50",
    conversion: "text-emerald-600 bg-emerald-50",
    time: "text-purple-600 bg-purple-50",
    value: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colorMap[type]}`}>
        {type === "leads" && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )}
        {type === "conversion" && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        )}
        {type === "time" && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )}
        {type === "value" && (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-sm text-gray-700 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
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
