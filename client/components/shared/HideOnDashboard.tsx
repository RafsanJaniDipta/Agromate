"use client";

import { usePathname } from "@/i18n/navigation";

// Full-screen app sections with their own frame; site-wide pieces like the footer stay out of them
const appSections = ["/dashboard", "/admin", "/expert"];

// Renders its children on public pages only.
export default function HideOnDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return appSections.some((section) => pathname.startsWith(section)) ? null : children;
}
