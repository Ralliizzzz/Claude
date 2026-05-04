"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type WeekData = { week: string; antal: number };
type StatusData = { name: string; value: number; color: string };

export function DashboardCharts({
  weeklyData,
  statusData,
}: {
  weeklyData: WeekData[];
  statusData: StatusData[];
}) {
  const total = statusData.reduce((s, d) => s + d.value, 0);
  const hasAnyStatus = total > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
      {/* Bar chart */}
      <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 mb-4">Leads per uge</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyData} barSize={24} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
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
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                fontSize: 12,
                padding: "6px 10px",
              }}
              formatter={(v) => [v, "Leads"]}
              cursor={{ fill: "#F9FAFB" }}
            />
            <Bar dataKey="antal" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut chart */}
      <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 mb-4">Status fordeling</p>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie
                  data={hasAnyStatus ? statusData : [{ name: "Tom", value: 1, color: "#F3F4F6" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={52}
                  paddingAngle={hasAnyStatus ? 2 : 0}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(hasAnyStatus ? statusData : [{ color: "#F3F4F6" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">{total}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-500 flex-1">{entry.name}</span>
                <span className="text-xs font-semibold text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
