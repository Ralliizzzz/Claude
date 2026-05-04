"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "3M", value: "90d" },
  { label: "6M", value: "180d" },
  { label: "1Å", value: "365d" },
  { label: "Alt", value: "all" },
] as const;

export function PeriodSelector({
  activePeriod,
  activeFrom,
  activeTo,
}: {
  activePeriod: string;
  activeFrom?: string;
  activeTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isCustom = !!activeFrom;
  const [showPicker, setShowPicker] = useState(isCustom);
  const [from, setFrom] = useState(activeFrom ?? "");
  const [to, setTo] = useState(activeTo ?? "");

  function selectPreset(value: string) {
    setShowPicker(false);
    router.replace(`${pathname}?period=${value}`);
  }

  function applyCustom() {
    if (!from || !to) return;
    router.replace(`${pathname}?from=${from}&to=${to}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => selectPreset(p.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              !isCustom && activePeriod === p.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isCustom || showPicker
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Periode
        </button>
      </div>

      {showPicker && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-xs text-gray-400">—</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={applyCustom}
            disabled={!from || !to}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Vis
          </button>
        </div>
      )}
    </div>
  );
}
