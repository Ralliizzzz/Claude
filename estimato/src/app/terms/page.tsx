import Link from "next/link"

export const metadata = {
  title: "Vilkår for brug – Estimato",
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vilkår for brug</h1>
        <p className="text-gray-500 text-sm mb-12">Senest opdateret: maj 2025</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Hvad er Estimato?</h2>
            <p>
              Estimato er en SaaS-platform til danske rengøringsvirksomheder. Platformen giver adgang til
              en indlejrbar prisberegner, lead-håndtering og et bookingsystem. Estimato er udviklet og drevet
              af Estimato ApS (under stiftelse).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Prøveperiode og abonnement</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Alle nye brugere får adgang til en gratis prøveperiode på 14 dage fra oprettelsesdatoen.</li>
              <li>Intet kreditkort kræves for at starte prøveperioden.</li>
              <li>Prøveperioden overgår ikke automatisk til et betalt abonnement — du skal aktivt vælge at fortsætte.</li>
              <li>Det løbende abonnement koster 499 kr. pr. måned inkl. moms og faktureres månedligt via Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Opsigelse</h2>
            <p>
              Du kan opsige dit abonnement når som helst via dit dashboard eller ved at kontakte os.
              Opsigelsen træder i kraft ved udløbet af den igangværende faktureringsperiode.
              Ingen refusion af allerede betalte perioder.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Brug af tjenesten</h2>
            <p>Du må udelukkende bruge Estimato til lovlige formål i forbindelse med din erhvervsvirksomhed. Det er ikke tilladt at:</p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>Videresælge eller licensere adgangen til platformen til tredjepart</li>
              <li>Forsøge at tilgå andre virksomheders data</li>
              <li>Anvende platformen til spam eller vildledende markedsføring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Databehandling — dit ansvar</h2>
            <p>
              Når dine kunder benytter din prisberegner, indsamles personoplysninger (navn, e-mail, telefon, adresse).
              Du er dataansvarlig for disse oplysninger. Estimato fungerer som databehandler på dine vegne.
            </p>
            <p className="mt-3">
              Du er ansvarlig for:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5">
              <li>At have et lovligt grundlag for behandlingen af dine kunders personoplysninger</li>
              <li>At oplyse dine kunder om, hvordan du behandler deres data</li>
              <li>At overholde gældende databeskyttelseslovgivning, herunder GDPR</li>
            </ul>
            <p className="mt-3">
              Disse vilkår udgør tillige en databehandleraftale (DPA) i henhold til GDPR art. 28.
              Estimato behandler udelukkende data efter dokumenterede instruktioner fra dig og
              træffer passende tekniske og organisatoriske sikkerhedsforanstaltninger.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Tilgængelighed og ændringer</h2>
            <p>
              Vi tilstræber høj oppetid, men garanterer ikke uafbrudt adgang. Vi forbeholder os retten
              til at ændre, opdatere eller afbryde dele af tjenesten med passende varsel.
              Væsentlige ændringer i disse vilkår meddeles via e-mail mindst 30 dage i forvejen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Ansvarsbegrænsning</h2>
            <p>
              Estimato er ansvarlig for direkte tab som følge af grov uagtsomhed op til et beløb svarende
              til 3 måneders abonnement. Vi er ikke ansvarlige for indirekte tab, driftstab eller tabt fortjeneste.
              Prisberegnerens resultater er vejledende og udgør ikke et juridisk bindende tilbud fra Estimatos side.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Lovvalg og værneting</h2>
            <p>
              Disse vilkår er underlagt dansk ret. Eventuelle tvister afgøres ved de danske domstole
              med Retten i København som første instans.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Kontakt</h2>
            <p>
              Spørgsmål til disse vilkår kan rettes til{" "}
              <a href="mailto:estimato@estimato.dk" className="text-blue-600 hover:underline">estimato@estimato.dk</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-8 flex gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privatlivspolitik</Link>
          <Link href="/" className="hover:text-gray-600 transition-colors">Tilbage til forsiden</Link>
        </div>
      </footer>
    </div>
  )
}
