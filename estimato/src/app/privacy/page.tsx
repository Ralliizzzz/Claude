import Link from "next/link"

export const metadata = {
  title: "Privatlivspolitik – Estimato",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Estimato</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privatlivspolitik</h1>
        <p className="text-gray-500 text-sm mb-12">Senest opdateret: maj 2025</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Dataansvarlig</h2>
            <p>
              Estimato er en SaaS-platform udviklet og drevet af Estimato ApS (under stiftelse).
              For spørgsmål om behandling af dine personoplysninger kan du kontakte os på:{" "}
              <a href="mailto:estimato@estimato.dk" className="text-blue-600 hover:underline">estimato@estimato.dk</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Hvilke oplysninger indsamler vi om dig som bruger?</h2>
            <p>Når du opretter en konto som rengøringsvirksomhed, behandler vi følgende oplysninger:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Firmanavn</li>
              <li>E-mailadresse</li>
              <li>Telefonnummer (valgfrit)</li>
              <li>Betalingsoplysninger (håndteres af Stripe — vi gemmer ikke kortdata)</li>
            </ul>
            <p className="mt-3">
              Formålet er at levere platformen og administrere dit abonnement.
              Retsgrundlaget er opfyldelse af kontrakt (GDPR art. 6, stk. 1, litra b).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Slutkundedata — Estimato som databehandler</h2>
            <p>
              Når dine kunder udfylder din prisberegner, indsamles oplysninger som navn, e-mail, telefonnummer,
              adresse og ejendomsdata. Disse oplysninger tilhører din virksomhed.
            </p>
            <p className="mt-3">
              <strong>Du er dataansvarlig</strong> for dine slutkunders data. Estimato handler som
              databehandler på dine vegne og behandler kun oplysningerne efter dine instruktioner.
              Du har som rengøringsvirksomhed ansvaret for at oplyse dine kunder om, hvordan
              du behandler deres personoplysninger, og for at sikre, at du har et lovligt grundlag
              for behandlingen.
            </p>
            <p className="mt-3">
              Slutkundedata (leads og bookinger) slettes senest 2 år efter oprettelse,
              med mindre du selv har slettet dem inden da.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Tredjeparter vi deler data med</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Supabase</strong> — databasehosting (EU-region)</li>
              <li><strong>Vercel</strong> — serverhosting</li>
              <li><strong>Stripe</strong> — betalingsbehandling</li>
              <li><strong>Resend</strong> — e-mailudsendelse</li>
              <li><strong>GatewayAPI</strong> — SMS-notifikationer (dansk udbyder)</li>
            </ul>
            <p className="mt-3">Vi indgår databehandleraftaler med alle underleverandører og overfører ikke data uden for EU/EØS.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Cookies</h2>
            <p>
              Estimato bruger udelukkende teknisk nødvendige cookies til at holde dig logget ind (sessions-cookies fra Supabase Auth).
              Vi anvender ikke tracking- eller analysecookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Dine rettigheder</h2>
            <p>Du har ret til at:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Få indsigt i de oplysninger vi har om dig</li>
              <li>Få urigtige oplysninger berigtiget</li>
              <li>Få dine oplysninger slettet ("retten til at blive glemt")</li>
              <li>Gøre indsigelse mod behandlingen</li>
              <li>Modtage dine oplysninger i et maskinlæsbart format (dataportabilitet)</li>
            </ul>
            <p className="mt-3">
              For at udøve dine rettigheder, kontakt os på{" "}
              <a href="mailto:estimato@estimato.dk" className="text-blue-600 hover:underline">estimato@estimato.dk</a>.
              Vi besvarer din henvendelse inden for 30 dage.
            </p>
            <p className="mt-3">
              Du kan også klage til{" "}
              <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Datatilsynet</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Ændringer til denne politik</h2>
            <p>
              Vi opdaterer denne privatlivspolitik, når det er nødvendigt. Væsentlige ændringer meddeles
              via e-mail til registrerede brugere.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Vilkår for brug</Link>
          <Link href="/" className="hover:text-gray-600 transition-colors">Tilbage til forsiden</Link>
        </div>
      </footer>
    </div>
  )
}
