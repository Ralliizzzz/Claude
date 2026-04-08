import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Genererer ledige tider for de næste 14 dage baseret på opening_hours
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date") // YYYY-MM-DD

  const supabase = await createServiceClient()
  const { data: settings } = await supabase
    .from("quote_settings")
    .select("opening_hours")
    .eq("company_id", companyId)
    .single()

  if (!settings) {
    return NextResponse.json({ error: "Ikke fundet" }, { status: 404 })
  }

  const openingHours = settings.opening_hours as Record<
    string,
    { open: string; close: string } | null
  >

  // Hent eksisterende bookinger for at filtrere optagne tider
  const today = new Date()
  const twoWeeks = new Date(today)
  twoWeeks.setDate(twoWeeks.getDate() + 14)

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at")
    .eq("company_id", companyId)
    .gte("scheduled_at", today.toISOString())
    .lte("scheduled_at", twoWeeks.toISOString())

  const bookedTimes = new Set(
    (existingBookings ?? []).map((b) => b.scheduled_at)
  )

  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const slots: string[] = []

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dayKey = dayNames[date.getDay()]
    const hours = openingHours[dayKey]
    if (!hours) continue

    const [openH] = hours.open.split(":").map(Number)
    const [closeH] = hours.close.split(":").map(Number)

    // Generer tider hver 2. time
    for (let h = openH; h < closeH; h += 2) {
      const slot = new Date(date)
      slot.setHours(h, 0, 0, 0)
      const iso = slot.toISOString()
      if (!bookedTimes.has(iso)) slots.push(iso)
    }
  }

  // Filtrer på specifik dato hvis angivet
  const filtered = dateStr
    ? slots.filter((s) => s.startsWith(dateStr))
    : slots.slice(0, 20)

  return NextResponse.json(filtered, {
    headers: { "Access-Control-Allow-Origin": "*" },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  })
}
