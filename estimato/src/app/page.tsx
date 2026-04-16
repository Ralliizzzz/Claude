import Link from "next/link"
import Script from "next/script"


const features = [
  {
    icon: "🧮",
    title: "Automatisk prisberegning",
    desc: "Kunden taster sin adresse — Estimato henter m² fra BBR og beregner prisen på sekunder. Ingen manuel sagsbehandling.",
  },
  {
    icon: "📥",
    title: "Leads direkte i dashboardet",
    desc: "Alle forespørgsler samles ét sted. Se navn, adresse, pris og kontaktinfo — og opfølg med ét klik.",
  },
  {
    icon: "📅",
    title: "Bookinger og notifikationer",
    desc: "Kunder booker selv en tid. Du modtager en SMS og e-mail. Bekræft eller aflys direkte fra dashboardet.",
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
]

export default function HomePage() {
  return (
    <>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">Estimato</span>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log ind
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Prøv gratis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-5">
            Automatiser tilbud og booking
            <br />
            for dit rengøringsfirma
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto mb-8">
            Estimato giver din hjemmeside en prisberegner der selv henter m² fra BBR, beregner prisen og tager imod bookinger — mens du sover.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signup"
              className="bg-blue-500 text-white px-7 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
            >
              Prøv gratis i 14 dage
            </Link>
            <Link
              href="/auth/login"
              className="border border-gray-200 px-7 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Log ind
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            499 kr/md · Intet kreditkort ved oprettelse
          </p>
        </section>

        {/* Widget demo */}
        <section className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Prøv beregneren selv</h2>
              <p className="text-gray-500 text-sm">
                Sådan ser den ud på din hjemmeside. Kunden taster adressen — resten klarer Estimato.
              </p>
            </div>

            <div className="flex justify-center">
              <div id="lead-widget" data-company="5a5dd101-7be3-4035-9be3-8e87b94c2e89" className="w-full max-w-lg" />
              <Script
                src="https://estimato-xi.vercel.app/widget.js?v=4"
                strategy="lazyOnload"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Alt hvad du har brug for</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-gray-100 rounded-xl p-6"
              >
                <p className="text-3xl mb-3">{f.icon}</p>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10">Sådan virker det</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-4">
                    {s.n}
                  </div>
                  <h3 className="font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">Én simpel pris</h2>
          <p className="text-gray-500 text-center text-sm mb-10">
            Ingen skjulte gebyrer. Ingen binding.
          </p>
          <div className="max-w-sm mx-auto border border-gray-200 rounded-2xl p-8">
            <div className="mb-6">
              <p className="text-4xl font-bold">
                499 <span className="text-xl font-medium text-gray-500">kr/md</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">14 dages gratis prøveperiode</p>
            </div>
            <ul className="space-y-2.5 mb-8">
              {planFeatures.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 font-bold mt-0.5">✓</span>
                  {feat}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup"
              className="block w-full text-center bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
            >
              Start gratis prøveperiode
            </Link>
            <p className="text-xs text-gray-400 text-center mt-3">
              Intet kreditkort krævet
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">© Estimato 2025</span>
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Log ind
          </Link>
        </div>
      </footer>
    </>
  )
}
