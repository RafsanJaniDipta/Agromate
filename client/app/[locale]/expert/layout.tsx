import { resolveLocale } from "@/i18n/params";
import DashboardShell from "@/components/dashboard/DashboardShell";

// Expert dashboard: same frame as the farmer's, open to experts only.
export default async function ExpertLayout({ children, params }: LayoutProps<"/[locale]/expert">) {
  await resolveLocale(params);

  return <DashboardShell role="EXPERT">{children}</DashboardShell>;
}
