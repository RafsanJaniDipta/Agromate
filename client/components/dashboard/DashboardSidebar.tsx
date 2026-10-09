"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { dashboardNav } from "@/components/dashboard/dashboardNav";
import UnreadBadge from "@/components/chat/UnreadBadge";
import { useChatUnread } from "@/components/chat/ChatUnread";
import type { Role } from "@/lib/session";

type RailLinkProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isOpen: boolean;
  // Unread count shown on the icon (chat only)
  badge?: number;
};

function RailLink({ href, label, Icon, isActive, isOpen, badge = 0 }: RailLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex h-10 items-center gap-4 rounded-2xl px-3 transition ${
        isActive
          ? "bg-white text-zinc-900"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="relative shrink-0">
        <Icon className="size-6" />
        <UnreadBadge count={badge} className="absolute -right-2 -top-1.5" />
      </span>
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
  const { count: unreadMessages } = useChatUnread();

  return (
    // min-h keeps every rail icon visible on short pages, since the rail itself is absolutely positioned
    // (the farmer rail: 16 links of 40px with 4px gaps, plus padding, fit in 46rem)
    <div className="relative hidden min-h-184 w-20 shrink-0 md:block print:hidden">
      <nav
        aria-label={t("label")}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`group/rail absolute inset-y-0 left-0 z-20 flex flex-col justify-between overflow-hidden rounded-4xl border border-white/10 px-4 py-4 backdrop-blur-xl transition-[width,background-color] duration-300 ${
          isOpen ? "w-60 bg-black/60" : "w-20 bg-black/40"
        }`}
      >
        <ul className="flex flex-col gap-1">
          {links.map(({ href, key, Icon }) => (
            <li key={key}>
              <RailLink
                href={href}
                label={t(key)}
                Icon={Icon}
                isActive={href === pathname}
                isOpen={isOpen}
                badge={key === "messages" ? unreadMessages : 0}
              />
            </li>
          ))}
        </ul>

        <ul className="flex flex-col gap-1">
          {footerLinks.map(({ href, key, Icon }) => (
            <li key={key}>
              <RailLink
                href={href}
                label={t(key)}
                Icon={Icon}
                isActive={href === pathname}
                isOpen={isOpen}
                badge={key === "messages" ? unreadMessages : 0}
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
