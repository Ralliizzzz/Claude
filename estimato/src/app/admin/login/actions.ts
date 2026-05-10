"use server"

import { cookies } from "next/headers"
import { createHmac } from "crypto"
import { redirect } from "next/navigation"

function adminToken() {
  return createHmac("sha256", process.env.ADMIN_PASSWORD!)
    .update(process.env.ADMIN_EMAIL!)
    .digest("hex")
}

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    redirect("/admin/login?error=1")
  }

  const cookieStore = await cookies()
  cookieStore.set("admin_session", adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  redirect("/admin/companies")
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  redirect("/admin/login")
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  if (!token) return false
  return token === adminToken()
}
