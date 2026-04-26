"use client";

import { useState, useEffect, useRef } from "react";

export default function EmbedClient({ companyId }: { companyId: string; appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(false);

  const embedCode = `<div id="lead-widget" data-company="${companyId}"></div>\n<script src="https://estimato-xi.vercel.app/widget.js?v=6"></script>`;

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const existing = document.getElementById("estimato-preview-script");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "estimato-preview-script";
    script.src = `/widget.js?v=6&t=${Date.now()}`;
    document.body.appendChild(script);

    return () => { script.remove(); };
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    {
      number: "1",
      title: "Kopiér koden",
      description: "Tryk på knappen nedenfor for at kopiere din personlige embed-kode.",
    },
    {
      number: "2",
      title: "Indsæt på din hjemmeside",
      description: "Indsæt koden i HTML-kilden dér, hvor du vil vise tilbudsberegneren.",
    },
    {
      number: "3",
      title: "Du er klar",
      description: "Kunder kan nu udfylde beregneren og sende dig en forespørgsel direkte.",
    },
  ]

  return (
    <div className="flex flex-col gap-4">

      {/* Vejledning */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Sådan installerer du widget&apos;en</h2>
        <p className="text-sm text-gray-500 mb-6">Tre hurtige trin og din tilbudsberegner er live på din hjemmeside.</p>

        <div className="flex flex-col gap-4">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {step.number}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embed-kode */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Din embed-kode</h2>
        <p className="text-sm text-gray-500 mb-5">Unik for din konto — del den ikke med andre.</p>

        <div className="relative">
          <pre className="bg-gray-950 text-gray-100 text-xs rounded-xl p-4 pr-28 overflow-x-auto leading-relaxed font-mono">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              copied
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {copied ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Kopieret
              </span>
            ) : "Kopiér"}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Forhåndsvisning</h2>
        <p className="text-sm text-gray-500 mb-5">Sådan ser beregneren ud for dine kunder.</p>

        {/* Browser chrome */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="ml-3 flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 truncate">
              dinhjemmeside.dk
            </div>
          </div>
          <div className="bg-gray-50 p-6 flex justify-center">
            <div id="lead-widget" data-company={companyId} />
          </div>
        </div>
      </div>

    </div>
  );
}
