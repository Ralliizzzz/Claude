import { Resend } from "resend"

const ACTION_LABEL: Record<string, string> = {
  book: "Ønsker at booke tid",
  callback: "Ønsker at blive ringet op",
  email: "Ønsker tilbud på email",
}

const PROPERTY_LABEL: Record<string, string> = {
  house: "Villa/Hus",
  apartment: "Lejlighed",
  commercial: "Erhverv",
}

interface PriceBreakdownForEmail {
  base: number
  add_ons: { name: string; price: number }[]
  discount: { name: string; value: number } | null
  frequency_discount: { name: string; value: number } | null
  transport_fee: { amount: number; billable_km: number; price_per_km: number } | null
  total: number
}

interface LeadData {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string
  sqm: number | null
  property_type: string | null
  price: number
  action_type: string
  price_breakdown?: unknown
}

interface CompanyData {
  company_name: string
  email: string
  phone: string | null
}

// ─── Email til virksomhed ────────────────────────────────────────────────────

export async function sendLeadEmailToCompany(
  company: CompanyData,
  lead: LeadData
): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[notify] RESEND_API_KEY ikke sat — email ikke sendt")
    return
  }

  const resend = new Resend(key)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato.dk"
  const dashboardUrl = `${appUrl}/dashboard/leads`

  await resend.emails.send({
    from: "Estimato <noreply@estimato.dk>",
    to: company.email,
    subject: `Nyt lead: ${lead.name} — ${lead.price.toLocaleString("da-DK")} kr`,
    html: companyLeadEmail({ company, lead, dashboardUrl }),
  })
}

// ─── Email til kunde (tilbud) ────────────────────────────────────────────────

export async function sendQuoteEmailToCustomer(
  company: CompanyData,
  lead: LeadData,
  quoteUrl?: string
): Promise<void> {
  if (!lead.email) return

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[notify] RESEND_API_KEY ikke sat — quote email ikke sendt")
    return
  }

  const resend = new Resend(key)

  await resend.emails.send({
    from: `${company.company_name} <noreply@estimato.dk>`,
    to: lead.email,
    subject: `Dit tilbud fra ${company.company_name} — ${lead.price.toLocaleString("da-DK")} kr`,
    html: customerQuoteEmail({ company, lead, quoteUrl }),
  })
}

// ─── Email til kunde (booking bekræftelse) ──────────────────────────────────

export async function sendBookingEmailToCustomer(
  company: CompanyData,
  lead: LeadData,
  scheduledAt: string
): Promise<void> {
  if (!lead.email) return

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[notify] RESEND_API_KEY ikke sat — booking email ikke sendt")
    return
  }

  const resend = new Resend(key)

  // Formatér tidspunkt — naive ISO string tolkes som lokal tid
  const date = new Date(scheduledAt)
  const dayLabel = date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })
  const startTime = date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const endTime = new Date(date.getTime() + 7200000).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const timeLabel = `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, ${startTime}–${endTime}`

  await resend.emails.send({
    from: `${company.company_name} <noreply@estimato.dk>`,
    to: lead.email,
    subject: `Din booking afventer bekræftelse — ${company.company_name}`,
    html: customerBookingEmail({ company, lead, timeLabel }),
  })
}

// ─── Email til kunde (booking bekræftet af virksomhed) ──────────────────────

export async function sendBookingConfirmedToCustomer(
  company: CompanyData,
  lead: Pick<LeadData, "name" | "email" | "address" | "sqm" | "property_type" | "price">,
  scheduledAt: string
): Promise<void> {
  if (!lead.email) return

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[notify] RESEND_API_KEY ikke sat — bekræftelsesmail ikke sendt")
    return
  }

  const resend = new Resend(key)

  const date = new Date(scheduledAt)
  const dayLabel = date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })
  const startTime = date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const endTime = new Date(date.getTime() + 7200000).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const timeLabel = `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, ${startTime}–${endTime}`

  await resend.emails.send({
    from: `${company.company_name} <noreply@estimato.dk>`,
    to: lead.email,
    subject: `Din booking er bekræftet — ${company.company_name}`,
    html: customerBookingConfirmedEmail({ company, lead, timeLabel }),
  })
}

// ─── Email til kunde (booking aflyst af virksomhed) ─────────────────────────

export async function sendBookingCancelledToCustomer(
  company: CompanyData,
  lead: Pick<LeadData, "name" | "email" | "address" | "price">,
  scheduledAt: string
): Promise<void> {
  if (!lead.email) return

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[notify] RESEND_API_KEY ikke sat — aflysningsmail ikke sendt")
    return
  }

  const resend = new Resend(key)

  const date = new Date(scheduledAt)
  const dayLabel = date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })
  const startTime = date.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const endTime = new Date(date.getTime() + 7200000).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
  const timeLabel = `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, ${startTime}–${endTime}`

  await resend.emails.send({
    from: `${company.company_name} <noreply@estimato.dk>`,
    to: lead.email,
    subject: `Din booking er aflyst — ${company.company_name}`,
    html: customerBookingCancelledEmail({ company, lead, timeLabel }),
  })
}

// ─── SMS til virksomhed ──────────────────────────────────────────────────────

export async function sendLeadSmsToCompany(
  company: CompanyData,
  lead: LeadData
): Promise<void> {
  const token = process.env.GATEWAYAPI_TOKEN
  if (!token) {
    console.warn("[notify] GATEWAYAPI_TOKEN ikke sat — SMS ikke sendt")
    return
  }
  if (!company.phone) return

  const msisdn = normalizePhone(company.phone)
  if (!msisdn) {
    console.warn("[notify] Ugyldigt telefonnummer:", company.phone)
    return
  }

  const message = `Nyt lead fra ${lead.name} (${lead.price.toLocaleString("da-DK")} kr) – ${ACTION_LABEL[lead.action_type] ?? lead.action_type}. Tjek dit dashboard.`

  const res = await fetch("https://gatewayapi.eu/rest/mtsms", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: "Estimato",
      message,
      recipients: [{ msisdn }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[notify] GatewayAPI fejl:", res.status, body)
  }
}

// ─── Hjælpefunktioner ────────────────────────────────────────────────────────

function normalizePhone(phone: string): number | null {
  // Fjern alt undtagen cifre
  const digits = phone.replace(/\D/g, "")
  // Dansk nummer uden landekode: 8 cifre → tilføj 45
  if (digits.length === 8) return Number("45" + digits)
  // Med landekode (45XXXXXXXX)
  if (digits.length === 10 && digits.startsWith("45")) return Number(digits)
  // Med + prefix allerede fjernet (e.g. 4512345678)
  if (digits.length >= 10) return Number(digits)
  return null
}

// ─── Email templates ─────────────────────────────────────────────────────────

function companyLeadEmail({
  company,
  lead,
  dashboardUrl,
}: {
  company: CompanyData
  lead: LeadData
  dashboardUrl: string
}) {
  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#3b82f6;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:1.1rem;font-weight:700;">Estimato</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#111;">
            Nyt lead: ${lead.name}
          </h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:0.9rem;">
            Modtaget via din widget
          </p>

          <!-- Lead detaljer -->
          <table width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            ${row("Navn", lead.name)}
            ${lead.email ? row("Email", `<a href="mailto:${lead.email}" style="color:#3b82f6;">${lead.email}</a>`) : ""}
            ${lead.phone ? row("Telefon", `<a href="tel:${lead.phone}" style="color:#3b82f6;">${lead.phone}</a>`) : ""}
            ${row("Adresse", lead.address)}
            ${lead.sqm ? row("Størrelse", `${lead.sqm} m²`) : ""}
            ${lead.property_type ? row("Ejendomstype", PROPERTY_LABEL[lead.property_type] ?? lead.property_type) : ""}
            ${row("Pris", `<strong>${lead.price.toLocaleString("da-DK")} kr</strong>`)}
            ${row("Handling", ACTION_LABEL[lead.action_type] ?? lead.action_type)}
          </table>

          <!-- CTA -->
          <a href="${dashboardUrl}"
             style="display:block;text-align:center;background:#3b82f6;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;">
            Se lead i dashboard →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:0.78rem;text-align:center;">
            Estimato · Du modtager denne email fordi du har en aktiv konto
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function customerQuoteEmail({
  company,
  lead,
  quoteUrl,
}: {
  company: CompanyData
  lead: LeadData
  quoteUrl?: string
}) {
  const bd = (lead.price_breakdown ?? null) as PriceBreakdownForEmail | null
  const savings = Math.abs(
    ((bd?.discount?.value ?? 0) as number) + ((bd?.frequency_discount?.value ?? 0) as number)
  )

  const breakdownRows = bd
    ? `
      <table width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:8px;">
        ${row(`Grundpris${lead.sqm ? ` (${lead.sqm} m²)` : ""}`, `${bd.base.toLocaleString("da-DK")} kr`)}
        ${bd.add_ons.map((a) => row(a.name, `+${a.price.toLocaleString("da-DK")} kr`)).join("")}
        ${bd.transport_fee ? row(`Kørsel (${bd.transport_fee.billable_km} km × ${bd.transport_fee.price_per_km} kr/km)`, `+${bd.transport_fee.amount.toLocaleString("da-DK")} kr`) : ""}
        ${bd.discount ? rowGreen(bd.discount.name, `${bd.discount.value.toLocaleString("da-DK")} kr`) : ""}
        ${bd.frequency_discount ? rowGreen(`Hyppighedsrabat (${bd.frequency_discount.name})`, `${bd.frequency_discount.value.toLocaleString("da-DK")} kr`) : ""}
      </table>
      ${savings > 0 ? `<p style="margin:0 0 4px;font-size:0.8rem;color:#16a34a;text-align:right;">Du sparer ${savings.toLocaleString("da-DK")} kr</p>` : ""}
    `
    : ""

  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#111;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:1.1rem;font-weight:700;">${company.company_name}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#111;">
            Dit tilbud er klar, ${lead.name.split(" ")[0]}
          </h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:0.9rem;">
            Her er dit tilbud for rengøring af ${lead.address}
          </p>

          <!-- Prisoversigt -->
          ${breakdownRows}

          <!-- Total -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="margin:0 0 2px;color:#6b7280;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;">I alt inkl. moms</p>
              <p style="margin:0;font-size:1.8rem;font-weight:800;color:#2563eb;">${lead.price.toLocaleString("da-DK")} kr</p>
            </div>
            ${lead.sqm ? `<p style="margin:0;color:#9ca3af;font-size:0.82rem;">${lead.sqm} m²${lead.property_type ? ` · ${PROPERTY_LABEL[lead.property_type] ?? ""}` : ""}</p>` : ""}
          </div>

          <!-- CTA: Accepter eller rediger -->
          ${quoteUrl ? `
          <a href="${quoteUrl}"
             style="display:block;text-align:center;background:#2563eb;color:#fff;text-decoration:none;padding:16px;border-radius:10px;font-weight:700;font-size:0.95rem;margin-bottom:12px;letter-spacing:0.01em;">
            Accepter eller rediger tilbud →
          </a>
          <p style="margin:0 0 20px;color:#9ca3af;font-size:0.78rem;text-align:center;">
            Klik på knappen for at booke en tid eller justere tilbuddet
          </p>
          ` : ""}

          ${
            company.phone
              ? `<a href="tel:${company.phone}" style="display:block;text-align:center;background:#111;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;margin-bottom:12px;">Ring til os: ${company.phone}</a>`
              : ""
          }
          ${
            company.email
              ? `<a href="mailto:${company.email}" style="display:block;text-align:center;background:#fff;color:#374151;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;border:1px solid #e5e7eb;">Skriv til os</a>`
              : ""
          }
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:0.78rem;text-align:center;">
            ${company.company_name} · Leveret via Estimato
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function customerBookingEmail({
  company,
  lead,
  timeLabel,
}: {
  company: CompanyData
  lead: LeadData
  timeLabel: string
}) {
  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#111;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:1.1rem;font-weight:700;">${company.company_name}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#111;">
            Tak for din forespørgsel, ${lead.name.split(" ")[0]}!
          </h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:0.9rem;">
            Din booking afventer godkendelse — vi vender tilbage hurtigst muligt.
          </p>

          <!-- Ønsket tidspunkt -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;color:#3b82f6;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Ønsket tidspunkt</p>
            <p style="margin:0;font-size:1rem;font-weight:600;color:#1e3a8a;">${timeLabel}</p>
          </div>

          <!-- Tilbudsoverblik -->
          <table width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            ${row("Adresse", lead.address)}
            ${lead.sqm ? row("Størrelse", `${lead.sqm} m²`) : ""}
            ${lead.property_type ? row("Ejendomstype", PROPERTY_LABEL[lead.property_type] ?? lead.property_type) : ""}
            ${row("Tilbudspris", `<strong>${lead.price.toLocaleString("da-DK")} kr</strong>`)}
          </table>

          <p style="margin:0 0 24px;color:#374151;font-size:0.88rem;line-height:1.6;">
            Så snart vi har bekræftet din tid, modtager du en ny mail. Har du spørgsmål, er du velkommen til at kontakte os.
          </p>

          ${
            company.phone
              ? `<a href="tel:${company.phone}" style="display:block;text-align:center;background:#111;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;margin-bottom:12px;">Ring til os: ${company.phone}</a>`
              : ""
          }
          ${
            company.email
              ? `<a href="mailto:${company.email}" style="display:block;text-align:center;background:#fff;color:#374151;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;border:1px solid #e5e7eb;">Skriv til os</a>`
              : ""
          }
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:0.78rem;text-align:center;">
            ${company.company_name} · Leveret via Estimato
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function customerBookingCancelledEmail({
  company,
  lead,
  timeLabel,
}: {
  company: CompanyData
  lead: Pick<LeadData, "name" | "email" | "address" | "price">
  timeLabel: string
}) {
  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <tr><td style="background:#111;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:1.1rem;font-weight:700;">${company.company_name}</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#111;">
            Din booking er desværre aflyst
          </h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:0.9rem;">
            Hej ${lead.name.split(" ")[0]}, vi beklager at vi ikke kan komme til den aftalte tid.
          </p>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;color:#dc2626;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Aflyst tidspunkt</p>
            <p style="margin:0;font-size:1rem;font-weight:600;color:#7f1d1d;">${timeLabel}</p>
          </div>

          <p style="margin:0 0 24px;color:#374151;font-size:0.88rem;line-height:1.6;">
            Kontakt os endelig, hvis du ønsker at booke en ny tid eller har spørgsmål.
          </p>

          ${
            company.phone
              ? `<a href="tel:${company.phone}" style="display:block;text-align:center;background:#111;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;margin-bottom:12px;">Ring til os: ${company.phone}</a>`
              : ""
          }
          ${
            company.email
              ? `<a href="mailto:${company.email}" style="display:block;text-align:center;background:#fff;color:#374151;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;border:1px solid #e5e7eb;">Skriv til os</a>`
              : ""
          }
        </td></tr>

        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:0.78rem;text-align:center;">
            ${company.company_name} · Leveret via Estimato
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function customerBookingConfirmedEmail({
  company,
  lead,
  timeLabel,
}: {
  company: CompanyData
  lead: Pick<LeadData, "name" | "email" | "address" | "sqm" | "property_type" | "price">
  timeLabel: string
}) {
  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#16a34a;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:1.1rem;font-weight:700;">${company.company_name}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#111;">
            Din booking er bekræftet! ✓
          </h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:0.9rem;">
            Vi glæder os til at se dig, ${lead.name.split(" ")[0]}.
          </p>

          <!-- Tidspunkt -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;color:#16a34a;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Bekræftet tidspunkt</p>
            <p style="margin:0;font-size:1rem;font-weight:600;color:#14532d;">${timeLabel}</p>
          </div>

          <!-- Detaljer -->
          <table width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            ${row("Adresse", lead.address)}
            ${lead.sqm ? row("Størrelse", `${lead.sqm} m²`) : ""}
            ${lead.property_type ? row("Ejendomstype", PROPERTY_LABEL[lead.property_type] ?? lead.property_type) : ""}
            ${row("Pris", `<strong>${lead.price.toLocaleString("da-DK")} kr</strong>`)}
          </table>

          ${
            company.phone
              ? `<a href="tel:${company.phone}" style="display:block;text-align:center;background:#111;color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;margin-bottom:12px;">Kontakt os: ${company.phone}</a>`
              : ""
          }
          ${
            company.email
              ? `<a href="mailto:${company.email}" style="display:block;text-align:center;background:#fff;color:#374151;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:0.9rem;border:1px solid #e5e7eb;">Skriv til os</a>`
              : ""
          }
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:0.78rem;text-align:center;">
            ${company.company_name} · Leveret via Estimato
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:0.83rem;color:#6b7280;width:40%;white-space:nowrap;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:0.83rem;color:#111;">${value}</td>
  </tr>`
}

function rowGreen(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:0.83rem;color:#16a34a;width:40%;white-space:nowrap;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:0.83rem;color:#16a34a;">${value}</td>
  </tr>`
}
