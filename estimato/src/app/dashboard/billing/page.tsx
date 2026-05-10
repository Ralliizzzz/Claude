import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getStripe } from "@/lib/stripe"
import type { CompanyRow } from "@/types/database"
import { PortalButton, CheckoutButton } from "./BillingActions"

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatAmount(amount: number) {
  return (amount / 100).toLocaleString("da-DK", { style: "currency", currency: "DKK" })
}

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data } = await supabase
    .from("companies")
    .select("subscription_status, trial_end_date, stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single()

  const company = data as Pick<
    CompanyRow,
    "subscription_status" | "trial_end_date" | "stripe_customer_id" | "stripe_subscription_id"
  > | null

  const isActive = company?.subscription_status === "active"
  const isTrial = company?.subscription_status === "trial"
  const daysLeft = isTrial
    ? Math.max(0, Math.ceil((new Date(company!.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  // Hent Stripe-data hvis abonnement eksisterer
  let nextBillingDate: string | null = null
  let card: { brand: string; last4: string; exp_month: number; exp_year: number } | null = null
  let invoices: { id: string; number: string | null; amount: number; date: number; status: string; pdf: string | null }[] = []

  if (company?.stripe_subscription_id) {
    try {
      const sub = await getStripe().subscriptions.retrieve(company.stripe_subscription_id) as unknown as { current_period_end: number }
      nextBillingDate = formatDate(sub.current_period_end)
    } catch { /* ignorér */ }
  }

  if (company?.stripe_customer_id) {
    try {
      const methods = await getStripe().paymentMethods.list({
        customer: company.stripe_customer_id,
        type: "card",
        limit: 1,
      })
      const c = methods.data[0]?.card
      if (c) card = { brand: c.brand, last4: c.last4, exp_month: c.exp_month, exp_year: c.exp_year }
    } catch { /* ignorér */ }

    try {
      const inv = await getStripe().invoices.list({
        customer: company.stripe_customer_id,
        limit: 6,
      })
      invoices = inv.data.map((i) => ({
        id: i.id,
        number: i.number ?? null,
        amount: i.amount_paid,
        date: i.created,
        status: i.status ?? "unknown",
        pdf: i.invoice_pdf ?? null,
      }))
    } catch { /* ignorér */ }
  }

  const statusBadge = {
    active: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Aktiv</span>,
    trial: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Prøveperiode</span>,
    cancelled: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">Afmeldt</span>,
    expired: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">Udløbet</span>,
  }[company?.subscription_status ?? "trial"]

  const cardBrandLabel: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Abonnement</h1>
      <p className="text-sm text-gray-500 mb-8">Administrer dit abonnement, betalingsmetode og fakturaer.</p>

      {/* Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">Estimato — 499 kr/md</p>
              {statusBadge}
            </div>
            {isActive && nextBillingDate && (
              <p className="text-sm text-gray-500">Næste betaling: {nextBillingDate}</p>
            )}
            {isTrial && daysLeft !== null && daysLeft > 0 && (
              <p className="text-sm text-gray-500">{daysLeft} dag{daysLeft === 1 ? "" : "e"} tilbage af prøveperioden</p>
            )}
            {isTrial && daysLeft === 0 && (
              <p className="text-sm text-red-500">Prøveperioden er udløbet</p>
            )}
            {(company?.subscription_status === "cancelled" || company?.subscription_status === "expired") && (
              <p className="text-sm text-gray-500">Start et nyt abonnement for at genaktivere widgetten</p>
            )}
          </div>
          <div className="flex-shrink-0">
            {isActive && <PortalButton />}
            {!isActive && <CheckoutButton />}
          </div>
        </div>
      </div>

      {/* Betalingsmetode */}
      {card && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Betalingsmetode</p>
              <p className="text-sm text-gray-600">
                {cardBrandLabel[card.brand] ?? card.brand} •••• {card.last4}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Udløber {card.exp_month.toString().padStart(2, "0")}/{card.exp_year}
              </p>
            </div>
            <PortalButton label="Skift kort →" />
          </div>
        </div>
      )}

      {/* Fakturahistorik */}
      {invoices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Fakturaer</p>
          </div>
          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <p className="text-sm text-gray-800">{formatDate(inv.date)}</p>
                    {inv.number && <p className="text-xs text-gray-400">{inv.number}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">{formatAmount(inv.amount)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "paid"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {inv.status === "paid" ? "Betalt" : inv.status}
                  </span>
                  {inv.pdf && (
                    <a
                      href={inv.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
