import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { CompanyRow } from "@/types/database";
import LogoutButton from "./LogoutButton";
import { SidebarNav } from "./SidebarNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const companyResult = await supabase
    .from("companies")
    .select("*")
    .eq("id", user.id)
    .single();
  const company = companyResult.data as CompanyRow | null;

  if (company && !company.onboarding_completed_at) redirect("/onboarding");

  const isTrialExpired =
    company?.subscription_status === "trial" &&
    new Date(company.trial_end_date) < new Date();

  const daysLeft =
    company?.subscription_status === "trial" && !isTrialExpired
      ? Math.ceil(
          (new Date(company.trial_end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col px-3 py-5 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-6">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">Estimato</span>
        </div>

        <SidebarNav />

        {/* Footer section */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Forside
          </Link>

          {company && (
            <div className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 truncate mb-0.5">
                {company.company_name}
              </p>
              {daysLeft !== null && (
                <p className="text-xs text-amber-600">
                  {daysLeft} dag{daysLeft === 1 ? "" : "e"} tilbage af prøveperioden
                </p>
              )}
              {isTrialExpired && (
                <p className="text-xs text-red-500 font-medium">Prøveperiode udløbet</p>
              )}
              {company.subscription_status === "active" && (
                <p className="text-xs text-emerald-600 font-medium">Aktiv</p>
              )}
            </div>
          )}

          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
