"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type TimelinePoint = { label: string; antal: number };
export type FunnelItem = { label: string; count: number; pct: number; color: string };

export function DashboardCharts({
  timelineData,
  funnelData,
}: {
  timelineData: TimelinePoint[];
  funnelData: FunnelItem[];
}) {
  const hasData = timelineData.length > 0 && timelineData.some((d) => d.antal > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
      {/* Area chart */}
      <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 mb-4">Leads over tid</p>
        {!hasData ? (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
            Ingen leads i valgte periode
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={timelineData} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                  padding: "6px 10px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                }}
                formatter={(v) => [v, "Leads"]}
                cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="antal"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#leadGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Funnel */}
      <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 mb-5">Konverteringstragt</p>
        <div className="flex flex-col gap-5">
          {funnelData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-400">{item.pct}%</span>
                  <span className="text-xs font-semibold text-gray-900 w-5 text-right">{item.count}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(item.pct, item.count > 0 ? 4 : 0)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
