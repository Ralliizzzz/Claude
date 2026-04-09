import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { CompanyRow } from "@/types/database";
import LogoutButton from "./LogoutButton";

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
    .single()
  const company = companyResult.data as CompanyRow | null

  const isTrialExpired =
    company?.subscription_status === "trial" &&
    new Date(company.trial_end_date) < new Date();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-100 flex flex-col px-4 py-6 gap-1">
        <span className="font-bold text-lg mb-6 px-2">Estimato</span>

        <NavLink href="/dashboard">Oversigt</NavLink>
        <NavLink href="/dashboard/leads">Leads</NavLink>
        <NavLink href="/dashboard/bookings">Bookinger</NavLink>
        <NavLink href="/dashboard/settings">Indstillinger</NavLink>
        <NavLink href="/dashboard/embed">Embed widget</NavLink>

        <div className="mt-auto">
          {company && (
            <div className="px-2 py-2 rounded-lg bg-gray-50 text-xs text-gray-500">
              <p className="font-medium text-gray-700 truncate">
                {company.company_name}
              </p>
              {company.subscription_status === "trial" && !isTrialExpired && (
                <p>
                  Prøveperiode udløber{" "}
                  {new Date(company.trial_end_date).toLocaleDateString("da-DK")}
                </p>
              )}
              {isTrialExpired && (
                <p className="text-red-500">Prøveperiode udløbet</p>
              )}
            </div>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-2 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
    >
      {children}
    </Link>
  );
}
