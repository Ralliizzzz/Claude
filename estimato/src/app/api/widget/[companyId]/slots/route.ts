import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Genererer ledige tider for de næste 30 dage baseret på opening_hours
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date") // YYYY-MM-DD
  const mode = searchParams.get("mode")    // "dates" = returnér kun tilgængelige datoer

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

  const days = mode === "dates" ? 30 : 14

  // Hent eksisterende bookinger for at filtrere optagne tider
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + days)

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at")
    .eq("company_id", companyId)
    .gte("scheduled_at", today.toISOString())
    .lte("scheduled_at", future.toISOString())

  const bookedTimes = new Set(
    (existingBookings ?? []).map((b) => b.scheduled_at)
  )

  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const slots: string[] = []

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dayKey = dayNames[date.getDay()]
    const hours = openingHours[dayKey]
    if (!hours) continue

    const [openH] = hours.open.split(":").map(Number)
    const [closeH] = hours.close.split(":").map(Number)

    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")

    // Generer tider hver 2. time — naive datetime (ingen Z) så browseren viser lokal tid
    for (let h = openH; h < closeH; h += 2) {
      const iso = `${y}-${mo}-${dd}T${String(h).padStart(2, "0")}:00:00`
      if (!bookedTimes.has(iso)) slots.push(iso)
    }
  }

  // ?mode=dates → returnér unikke datoer med mindst én ledig tid
  if (mode === "dates") {
    const dates = [...new Set(slots.map((s) => s.substring(0, 10)))]
    return NextResponse.json(dates, {
      headers: { "Access-Control-Allow-Origin": "*" },
    })
  }

  // ?date=YYYY-MM-DD → returnér slots for den specifikke dato
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
