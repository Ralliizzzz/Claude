import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "./login/actions"
import AdminNav from "./AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
