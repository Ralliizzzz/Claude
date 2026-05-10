"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const benefits = [
  "Automatisk BBR-opslag og prisberegning",
  "Leads og bookinger samlet ét sted",
  "SMS- og e-mailnotifikationer",
  "Nem installation — to linjer kode",
];

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company_name: companyName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gray-900 flex-col justify-between p-10 relative overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-14">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg">Estimato</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Kom i gang gratis på under 10 minutter
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            Intet kreditkort. Ingen binding. Installér beregneren på din hjemmeside og begynd at modtage leads automatisk.
          </p>

          <div className="flex flex-col gap-4">
            {benefits.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {["bg-blue-400", "bg-emerald-400", "bg-amber-400"].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-gray-900`} />
                ))}
              </div>
              <p className="text-gray-400 text-xs">Bruges af rengøringsfirmaer over hele Danmark</p>
            </div>
            <p className="text-gray-600 text-xs">14 dages gratis prøveperiode · 499 kr/md derefter</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Estimato</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Opret konto</h1>
          <p className="text-gray-500 mb-8 text-sm">
            14 dages gratis prøveperiode · Intet kreditkort krævet
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Firmanavn</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Jensens Rengøring ApS"
                className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="din@email.dk"
                className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Adgangskode</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 tegn"
                className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-shadow"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-blue-600"
              />
              <label htmlFor="terms" className="text-sm text-gray-500 leading-relaxed cursor-pointer">
                Jeg accepterer Estimatos{" "}
                <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">vilkår for brug</Link>
                {" "}og{" "}
                <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">privatlivspolitik</Link>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !termsAccepted}
              className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm mt-1"
            >
              {loading ? "Opretter konto..." : "Opret gratis konto"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Har du allerede en konto?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Log ind
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
