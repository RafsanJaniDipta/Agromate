"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { dashboardNav } from "@/components/dashboard/dashboardNav";
import type { Role } from "@/lib/session";

type RailLinkProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isOpen: boolean;
};

function RailLink({ href, label, Icon, isActive, isOpen }: RailLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex h-12 items-center gap-4 rounded-2xl px-3 transition ${
        isActive
          ? "bg-white text-zinc-900"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="size-6 shrink-0" />
      <span
        className={`whitespace-nowrap text-sm font-medium transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-2 left-4 h-0.5 w-4 rounded-full bg-brand" />
      )}
    </Link>
  );
}

// Icon rail whose links depend on the signed-in role; expands on hover.
export default function DashboardSidebar({ role }: { role: Role }) {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { links, footerLinks } = dashboardNav[role];

  return (
    <div className="relative hidden w-20 shrink-0 md:block">
      <nav
        aria-label={t("label")}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`group/rail absolute inset-y-0 left-0 z-20 flex flex-col justify-between overflow-hidden rounded-4xl border border-white/10 px-4 py-4 backdrop-blur-xl transition-[width,background-color] duration-300 ${
          isOpen ? "w-60 bg-black/60" : "w-20 bg-black/40"
        }`}
      >
        <ul className="flex flex-col gap-3">
          {links.map(({ href, key, Icon }) => (
            <li key={key}>
              <RailLink
                href={href}
                label={t(key)}
                Icon={Icon}
                isActive={href === pathname}
                isOpen={isOpen}
              />
            </li>
          ))}
        </ul>

        <ul className="flex flex-col gap-3">
          {footerLinks.map(({ href, key, Icon }) => (
            <li key={key}>
              <RailLink
                href={href}
                label={t(key)}
                Icon={Icon}
                isActive={href === pathname}
                isOpen={isOpen}
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
