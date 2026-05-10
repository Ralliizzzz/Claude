import Link from "next/link"
import { adminLogout } from "./login/actions"

export default function AdminNav() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-sm mr-4">Estimato Admin</span>
      <Link href="/admin/companies" className="text-sm text-gray-300 hover:text-white transition-colors">
        Firmaer
      </Link>
      <Link href="/admin/feedback" className="text-sm text-gray-300 hover:text-white transition-colors">
        Feedback
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          → Dashboard
        </Link>
        <form action={adminLogout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">
            Log ud
          </button>
        </form>
      </div>
    </nav>
  )
}
