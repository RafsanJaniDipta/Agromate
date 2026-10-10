import { resolveLocale } from "@/i18n/params";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Admin dashboard: same frame as the farmer's, open to admins only.
// The (panel) group keeps /admin/login outside this frame.
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  await resolveLocale(params);

  return <DashboardShell role="ADMIN">{children}</DashboardShell>;
}
