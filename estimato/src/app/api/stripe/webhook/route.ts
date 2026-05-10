import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import type { SubscriptionStatus } from "@/types/database"

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Mangler signatur" }, { status: 400 })

  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Ugyldig signatur" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const companyId = session.metadata?.company_id
    if (companyId) {
      await supabase
        .from("companies")
        .update({
          subscription_status: "active" as SubscriptionStatus,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq("id", companyId)
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object
    const status: SubscriptionStatus = ["active", "past_due"].includes(sub.status)
      ? "active"
      : "cancelled"
    await supabase
      .from("companies")
      .update({ subscription_status: status })
      .eq("stripe_subscription_id", sub.id)
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object
    await supabase
      .from("companies")
      .update({ subscription_status: "cancelled" as SubscriptionStatus })
      .eq("stripe_subscription_id", sub.id)
  }

  return NextResponse.json({ received: true })
}
