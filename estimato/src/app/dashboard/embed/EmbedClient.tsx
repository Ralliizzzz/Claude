"use client";

import { useState, useEffect, useRef } from "react";

export default function EmbedClient({
  companyId,
}: {
  companyId: string;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(false);

  const embedCode = `<div id="lead-widget" data-company="${companyId}"></div>\n<script src="https://estimato-xi.vercel.app/widget.js?v=2"></script>`;

  // Loader widget-scriptet direkte på siden — ingen iframe nødvendig
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const existing = document.getElementById("estimato-preview-script");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "estimato-preview-script";
    script.src = "/widget.js?preview=1";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Embed widget</h1>
      <p className="text-gray-500 text-sm mb-8">
        Indsæt koden nedenfor på din hjemmeside for at vise tilbudsberegneren.
      </p>

      {/* Embed-kode */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-2">Din embed-kode</h2>
        <div className="relative">
          <pre className="bg-gray-950 text-gray-100 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {copied ? "Kopieret!" : "Kopiér"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Indsæt koden i HTML-kilden på den side, hvor du vil vise widgetten.
        </p>
      </div>

      {/* Live preview — widget monteres direkte her */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Forhåndsvisning</h2>
        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
          <div id="lead-widget" data-company={companyId} />
        </div>
      </div>
    </div>
  );
}
