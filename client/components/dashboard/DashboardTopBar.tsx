"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BellIcon, LogoutIcon, SearchIcon } from "@/components/icons";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import { dashboardNav } from "@/components/dashboard/dashboardNav";
import { countUnreadNotifications } from "@/lib/notifications";
import { loginPageFor, signOut, type Role } from "@/lib/session";

const roundButton =
  "flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-xl transition hover:bg-white/15";

// Top bar: logo, the role's section tabs, language toggle, search, notifications and logout.
export default function DashboardTopBar({ role }: { role: Role }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // The dot is a hint only, so a failed count just leaves it hidden
    countUnreadNotifications().then(setUnread).catch(() => {});
  }, []);

  async function handleSignOut() {
    // Leave even if the server call fails; the session expires on its own
    await signOut().catch(() => {});
    router.replace(loginPageFor(role));
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Logo className="text-lg" />

      {/* On phones the tabs drop to their own full-width row and scroll sideways */}
      <nav
        aria-label={t("tabs.label")}
        className="order-last w-full overflow-x-auto rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl md:order-none md:w-auto"
      >
        <ul className="flex min-w-max text-sm">
          {dashboardNav[role].tabs.map(({ href, key }) => {
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
          aria-label={t("notifications", { count: unread })}
          className={`relative ${roundButton}`}
        >
          <BellIcon className="size-5" />
          {unread > 0 && (
            <span className="absolute right-3 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-black/60" />
          )}
        </button>
        <button type="button" aria-label={t("signOut")} onClick={handleSignOut} className={roundButton}>
          <LogoutIcon className="size-5" />
        </button>
      </div>
    </header>
  );
}
