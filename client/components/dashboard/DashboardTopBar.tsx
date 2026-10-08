"use client";

import { useTranslations } from "next-intl";
import { SearchIcon } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import AccountMenu from "@/components/shared/AccountMenu";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import MobileNav from "@/components/dashboard/MobileNav";
import NotificationsMenu from "@/components/dashboard/NotificationsMenu";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { profilePageFor, type Role } from "@/lib/session";

const roundButton =
  "flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur-xl transition hover:bg-white/15";

// Top bar: menu button (phones only), logo, language toggle, search, notifications and the
// account avatar (profile, website, log out). Page links live in the sidebar.
export default function DashboardTopBar({ role }: { role: Role }) {
  const t = useTranslations("dashboard");
  const tAccount = useTranslations("nav.account");
  const router = useRouter();
  // The top bar sits inside the RoleGate, so the signed-in user is always known here
  const user = useCurrentUser();

  const profileHref = profilePageFor(role);
  const accountLinks = [
    ...(profileHref ? [{ href: profileHref, label: tAccount("profile") }] : []),
    { href: "/", label: tAccount("website") },
  ];

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <MobileNav role={role} buttonClassName={roundButton} />
        <Logo className="text-lg" />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        {/* Hidden on phones to leave room for the other buttons */}
        <span className="hidden sm:block">
          <button type="button" aria-label={t("search")} className={roundButton}>
            <SearchIcon className="size-5" />
          </button>
        </span>
        <NotificationsMenu buttonClassName={roundButton} />
        {/* Every role goes back to the home page after logging out */}
        <AccountMenu
          user={user}
          links={accountLinks}
          onSignedOut={() => router.replace("/")}
          circleClassName={roundButton}
        />
      </div>
    </header>
  );
}
