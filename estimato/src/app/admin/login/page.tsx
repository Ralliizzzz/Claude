import { adminLogin } from "./actions"

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const hasError = searchParams.error === "1"

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-bold text-white text-lg">Estimato Admin</span>
        </div>
        <form action={adminLogin} className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          {hasError && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
              Forkert email eller adgangskode
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Adgangskode</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="mt-1 w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Log ind
          </button>
        </form>
      </div>
    </div>
  )
}
