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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!company?.stripe_customer_id) {
    return NextResponse.json({ error: "Intet aktivt abonnement" }, { status: 400 })
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
