import { resolveLocale } from "@/i18n/params";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Farmer dashboard: every section shares the dashboard frame and is farmer-only.
export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/dashboard">) {
  await resolveLocale(params);

  return <DashboardShell role="FARMER">{children}</DashboardShell>;
}
