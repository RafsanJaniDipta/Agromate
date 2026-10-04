"use client";

import { useTranslations } from "next-intl";
import { BellIcon, SearchIcon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import { dashboardTabs } from "@/components/dashboard/dashboardNav";

type DashboardTopBarProps = {
  unreadNotifications: number;
};

const roundButton =
  "flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-xl transition hover:bg-white/15";

// Top bar: logo, section tabs, language toggle, search and notifications.
export default function DashboardTopBar({ unreadNotifications }: DashboardTopBarProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Logo className="text-lg" />

      {/* On phones the tabs drop to their own full-width row and scroll sideways */}
      <nav
        aria-label={t("tabs.label")}
        className="order-last w-full overflow-x-auto rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl md:order-none md:w-auto"
      >
        <ul className="flex min-w-max text-sm">
          {dashboardTabs.map(({ href, key }) => {
            const isActive = href === pathname;
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-full px-5 py-2.5 transition ${
                    isActive ? "bg-white text-zinc-900" : "text-white/60 hover:text-white"
                  }`}
                >
                  {t(`tabs.${key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <button type="button" aria-label={t("search")} className={roundButton}>
          <SearchIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label={t("notifications", { count: unreadNotifications })}
          className={`relative ${roundButton}`}
        >
          <BellIcon className="size-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-3 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-black/60" />
          )}
        </button>
      </div>
    </header>
  );
}
