import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BookingsTable from "./BookingsTable"

export interface BookingWithLead {
  id: string
  scheduled_at: string
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
  lead: {
    id: string
    name: string
    address: string
    price: number
    phone: string | null
    email: string | null
  }
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function BookingsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  let query = supabase
    .from("bookings")
    .select("id, scheduled_at, status, created_at, leads(id, name, address, price, phone, email)")
    .eq("company_id", user.id)
    .order("scheduled_at", { ascending: true })

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data } = await query

  // Filtrer fremtidige og tidligere bookinger
  const now = new Date()
  const bookings = ((data ?? []) as unknown as BookingWithLead[])
    .filter((b) => b.lead != null)

  const upcoming = bookings.filter((b) => new Date(b.scheduled_at) >= now)
  const past = bookings.filter((b) => new Date(b.scheduled_at) < now)

  // Tæl pr. status
  const allBookings = (
    await supabase
      .from("bookings")
      .select("status")
      .eq("company_id", user.id)
  ).data ?? []

  const counts = { all: 0, pending: 0, confirmed: 0, cancelled: 0 }
  for (const b of allBookings as { status: string }[]) {
    counts.all++
    if (b.status in counts) counts[b.status as keyof typeof counts]++
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Bookinger</h1>
      <p className="text-sm text-gray-500 mb-6">Planlagte rengøringsbesøg fra din widget.</p>
      <BookingsTable
        upcoming={upcoming}
        past={past}
        counts={counts}
        activeStatus={status ?? "all"}
      />
    </div>
  )
}
