"use client";

import { usePathname } from "@/i18n/navigation";

// Renders its children on public pages only; the dashboard is a full-screen app
// with its own navigation, so site-wide pieces like the footer stay out of it.
export default function HideOnDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname.startsWith("/dashboard") ? null : children;
}
