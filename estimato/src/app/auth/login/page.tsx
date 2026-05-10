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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.code === "email_not_confirmed") {
        setError("Din email er ikke bekræftet endnu. Tjek din indbakke og klik på bekræftelseslinket.");
      } else {
        setError("Forkert email eller adgangskode.");
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
            Automatiser tilbud og booking for dit rengøringsfirma
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            Ingen manuel sagsbehandling. Kunder beregner selv prisen, booker en tid — og du modtager alt i dit dashboard.
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
            <p className="text-white text-sm leading-relaxed mb-3">
              &ldquo;Vi bruger halv så lang tid på at svare tilbudsforespørgsler som vi gjorde før. Estimato er en game changer for os.&rdquo;
            </p>
            <p className="text-gray-500 text-xs">— Rengøringsfirma i Aarhus</p>
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

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Log ind</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Har du ikke en konto?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
              Prøv gratis i 14 dage
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Adgangskode</label>
                <Link href="/auth/glemt-adgangskode" className="text-xs text-blue-600 hover:underline">
                  Glemt adgangskode?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-shadow"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm mt-1"
            >
              {loading ? "Logger ind..." : "Log ind"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
