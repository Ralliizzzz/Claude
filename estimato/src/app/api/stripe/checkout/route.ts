import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"

const APP_URL = "https://estimato-xi.vercel.app"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 })

  const { data: company } = await supabase
    .from("companies")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single()

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    ...(company?.stripe_customer_id
      ? { customer: company.stripe_customer_id }
      : { customer_email: company?.email ?? undefined }),
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${APP_URL}/opgrader`,
    metadata: { company_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
