"use client";

import { useState } from "react";

export default function EmbedClient({
  companyId,
  appUrl,
}: {
  companyId: string;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<div id="lead-widget"></div>\n<script src="${appUrl}/widget.js" data-company="${companyId}"></script>`;

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

      {/* Live preview */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Forhåndsvisning</h2>
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
          <iframe
            src={`/api/widget-preview/${companyId}`}
            title="Widget forhåndsvisning"
            className="w-full"
            style={{ height: "600px", border: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
