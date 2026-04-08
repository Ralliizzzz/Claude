"use server"

import { createClient } from "@/lib/supabase/server"
import type { BookingRow } from "@/types/database"

export async function updateBookingStatus(
  bookingId: string,
  status: BookingRow["status"]
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Ikke autoriseret")

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("company_id", user.id)

  if (error) throw new Error("Kunne ikke opdatere booking")
}
