"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { sidebarFooterLinks, sidebarLinks } from "@/components/dashboard/dashboardNav";

type RailLinkProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
};

// One icon button on the rail; the label shows as a tooltip and is read by screen readers
function RailLink({ href, label, Icon, isActive }: RailLinkProps) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex size-12 items-center justify-center rounded-2xl transition ${
        isActive ? "bg-white text-zinc-900" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="size-6" />
      {/* Small green underline marks the current page */}
      {isActive && <span className="absolute bottom-2 h-0.5 w-4 rounded-full bg-brand" />}
    </Link>
  );
}

// Vertical icon rail on the left of the dashboard (hidden on phones).
export default function DashboardSidebar() {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="hidden w-20 shrink-0 flex-col items-center justify-between rounded-[2rem] border border-white/10 bg-black/40 py-4 backdrop-blur-xl md:flex"
    >
      <ul className="flex flex-col gap-3">
        {sidebarLinks.map(({ href, key, Icon }) => (
          <li key={key}>
            <RailLink href={href} label={t(key)} Icon={Icon} isActive={href === pathname} />
          </li>
        ))}
      </ul>

      <ul className="flex flex-col gap-3">
        {sidebarFooterLinks.map(({ href, key, Icon }) => (
          <li key={key}>
            <RailLink href={href} label={t(key)} Icon={Icon} isActive={href === pathname} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
