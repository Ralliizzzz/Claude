import Link from "next/link"

export default function CheckEmailPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email ?? ""

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Tjek din indbakke</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          Vi har sendt en bekræftelsesmail til
        </p>
        {email && (
          <p className="font-semibold text-gray-800 text-sm mb-4">{email}</p>
        )}
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Klik på linket i mailen for at aktivere din konto.
        </p>

        <Link
          href="/auth/login"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Gå til login →
        </Link>
      </div>
    </div>
  )
}
