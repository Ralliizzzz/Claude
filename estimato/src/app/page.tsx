import Link from "next/link"
import Script from "next/script"

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function LogoIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-6 h-6" : "w-7 h-7"
  const i = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
  return (
    <div className={`${s} bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
      <svg className={`${i} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
  )
}

function FeatureIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      {children}
    </div>
  )
}

const features = [
  {
    color: "bg-blue-50 text-blue-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="12" x2="10" y2="12" /><line x1="14" y1="12" x2="16" y2="12" />
        <line x1="8" y1="17" x2="10" y2="17" /><line x1="14" y1="17" x2="16" y2="17" />
      </svg>
    ),
    title: "Automatisk prisberegning",
    desc: "Kunden taster sin adresse — Estimato henter m² og boligtype fra BBR og beregner prisen på sekunder. Ingen manuel sagsbehandling.",
  },
  {
    color: "bg-violet-50 text-violet-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Leads i realtid",
    desc: "Alle forespørgsler samles ét sted med navn, adresse, pris og kontaktinfo. Opfølg direkte fra dashboardet.",
  },
  {
    color: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Online booking",
    desc: "Kunder booker selv en tid ud fra dine åbningstider. Du bekræfter eller aflyser direkte fra dashboardet.",
  },
  {
    color: "bg-amber-50 text-amber-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "SMS og e-mail notifikationer",
    desc: "Modtag besked med det samme, når en ny kunde henvender sig eller booker en tid hos dig.",
  },
  {
    color: "bg-rose-50 text-rose-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Nem installation",
    desc: "Kopiér to linjer kode og indsæt dem på din hjemmeside. Beregneren er klar på under 5 minutter — ingen udvikler nødvendig.",
  },
  {
    color: "bg-cyan-50 text-cyan-600",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    title: "Fleksible priser",
    desc: "Sæt tillægsydelser, rabatter, frekvensrabatter og transportgebyr op præcis som dit firma kræver det.",
  },
]

const steps = [
  {
    n: "1",
    title: "Installer beregneren",
    desc: "Kopiér to linjer kode og indsæt dem på din hjemmeside. Beregneren er klar på under 5 minutter.",
  },
  {
    n: "2",
    title: "Modtag leads automatisk",
    desc: "Kunden udfylder formularen, ser sin pris og sender forespørgslen. Du får besked med det samme.",
  },
  {
    n: "3",
    title: "Bekræft og book",
    desc: "Godkend bookingen med ét klik. Kunden modtager en bekræftelse — og du slipper for telefonopkald.",
  },
]

const planFeatures = [
  "Ubegrænsede leads og bookinger",
  "Automatisk BBR-opslag (m² og boligtype)",
  "Prisberegner med tillægsydelser og rabatter",
  "SMS- og e-mailnotifikationer",
  "Booking med åbningstider og tidsslots",
  "Nem installation — to linjer kode",
  "Transportgebyr og serviceradius",
  "Frekvensrabatter (ugentlig, 14-dages, månedlig)",
]

const faqs = [
  {
    q: "Hvad er Estimato?",
    a: "Estimato er et software-værktøj der giver dit rengøringsfirma en automatisk prisberegner og booking-formular på din hjemmeside. Kunderne beregner selv prisen, og du modtager leads og bookinger direkte i dit dashboard.",
  },
  {
    q: "Hvornår er jeg klar til at modtage leads?",
    a: "Du kan være klar på under 10 minutter. Opret din konto, sæt dine priser op, og kopiér to linjer kode ind på din hjemmeside. Så er du klar.",
  },
  {
    q: "Hvad sker der efter de 14 dages prøveperiode?",
    a: "Prøveperioden er gratis og kræver ikke kreditkort. Når de 14 dage er ovre, kan du vælge at fortsætte for 499 kr/md. Annullerer du, slettes dine data efter 30 dage.",
  },
  {
    q: "Kan jeg tilpasse prisberegneren til mit firma?",
    a: "Ja. Du kan sætte priser per m², intervaller, tillægsydelser, rabatter, frekvensrabatter og transportgebyr op — alt efter hvad der passer til din forretning.",
  },
  {
    q: "Virker det med alle hjemmesideplatforme?",
    a: "Ja. Estimato er et stykke kode der fungerer på alle hjemmesider — WordPress, Wix, Squarespace, håndkodet HTML — det hele. Du behøver ikke ændre noget på din hjemmeside udover at indsætte de to linjer.",
  },
]

export default function HomePage() {
  return (
    <>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="font-bold text-gray-900 tracking-tight">Estimato</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
              Log ind
            </Link>
            <Link href="/auth/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Prøv gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #2563eb 1px, transparent 0)", backgroundSize: "36px 36px" }}
          />
          <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 shadow-sm">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Lavet til danske rengøringsfirmaer
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900">
              Spar timer om ugen på<br />
              <span className="text-blue-600">manuelle tilbud og booking</span>
            </h1>

            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-9 leading-relaxed">
              Estimato installeres på din hjemmeside med to linjer kode. Kunderne beregner selv prisen, booker en tid — og du modtager alle leads direkte i dit dashboard.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap mb-7">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-200 hover:shadow-lg text-sm"
              >
                Start 14 dages gratis prøveperiode <IconArrow />
              </Link>
              <a
                href="#demo"
                className="border border-gray-200 bg-white text-gray-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                Se beregneren
              </a>
            </div>

            <div className="flex items-center justify-center gap-5 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5"><IconCheck /> Intet kreditkort</span>
              <span className="flex items-center gap-1.5"><IconCheck /> Opsæt på 5 minutter</span>
              <span className="flex items-center gap-1.5"><IconCheck /> Annuller når som helst</span>
            </div>
          </div>
        </section>

        {/* Key numbers strip */}
        <section className="border-y border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {[
                { value: "Under 10 min", label: "Fra oprettelse til første lead" },
                { value: "2 linjer kode", label: "At installere på din hjemmeside" },
                { value: "14 dage gratis", label: "Prøveperiode uden kreditkort" },
              ].map((stat) => (
                <div key={stat.label} className="py-4 sm:py-0">
                  <span className="text-2xl font-bold text-gray-900 block">{stat.value}</span>
                  <span className="text-sm text-gray-500 mt-0.5 block">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Widget demo */}
        <section id="demo" className="py-20 bg-gray-50 border-b border-gray-100 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Prøv beregneren selv</h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                Sådan ser den ud på din hjemmeside. Kunden taster adressen — resten klarer Estimato automatisk.
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              {/* Browser chrome */}
              <div className="bg-gray-200 rounded-t-2xl px-4 py-3 flex items-center gap-2 border border-b-0 border-gray-300">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white/80 rounded-md px-3 py-1 text-xs text-gray-400 ml-2 border border-gray-200">
                  dinhjemmeside.dk/rengøring
                </div>
              </div>
              <div className="bg-white rounded-b-2xl shadow-xl border border-gray-200 border-t-0 p-4">
                <div id="lead-widget" data-company="5a5dd101-7be3-4035-9be3-8e87b94c2e89" className="w-full" />
                <Script src={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato.dk"}/widget.js?v=6`} strategy="lazyOnload" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Alt hvad du har brug for</h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                Estimato håndterer hele processen fra forespørgsel til bekræftet booking — automatisk.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-sm transition-all">
                  <FeatureIcon color={f.color}>{f.icon}</FeatureIcon>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Kom i gang på tre trin</h2>
              <p className="text-gray-500">Fra nul til automatisk prisberegning på under 10 minutter.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-blue-100">
                    {s.n}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Én simpel pris</h2>
              <p className="text-gray-500">Ingen binding. Ingen skjulte gebyrer. Annuller når som helst.</p>
            </div>
            <div className="max-w-sm mx-auto">
              <div className="bg-white border-2 border-blue-600 rounded-2xl p-8 shadow-xl shadow-blue-50/50">
                <div className="mb-7">
                  <div className="inline-flex items-center bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Inkluderer alt
                  </div>
                  <p className="text-5xl font-bold text-gray-900">
                    499 <span className="text-2xl font-medium text-gray-400">kr/md</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1.5">14 dages gratis prøveperiode</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {planFeatures.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <IconCheck className="w-3 h-3" />
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className="block w-full text-center bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm shadow-md"
                >
                  Start gratis prøveperiode
                </Link>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Intet kreditkort krævet · Annuller når som helst
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3 text-gray-900">Hyppige spørgsmål</h2>
              <p className="text-gray-500">Har du andre spørgsmål? Kontakt os på hej@estimato.dk</p>
            </div>
            <div className="flex flex-col gap-2">
              {faqs.map((faq) => (
                <details key={faq.q} className="group bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 text-sm">
                    {faq.q}
                    <span className="ml-4 flex-shrink-0 w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-45">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Klar til at spare tid på tilbud?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
              Kom i gang i dag med en gratis prøveperiode på 14 dage. Intet kreditkort, ingen binding — og du kan installere beregneren på din hjemmeside på under 5 minutter.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-500 transition-colors text-sm shadow-lg"
            >
              Start din gratis prøveperiode <IconArrow />
            </Link>
            <p className="text-gray-600 text-sm mt-4">499 kr/md efter prøveperioden · Intet kreditkort krævet</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LogoIcon size="sm" />
              <span className="font-semibold text-white">Estimato</span>
              <span className="text-gray-700 mx-1.5">·</span>
              <span className="text-sm text-gray-500">© 2025</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Privatlivspolitik
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Vilkår
              </Link>
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Log ind
              </Link>
              <Link href="/auth/signup" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Opret konto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
