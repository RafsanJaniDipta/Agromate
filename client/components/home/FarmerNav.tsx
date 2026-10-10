"use client";

import { useTranslations } from "next-intl";
import AccountMenu from "@/components/shared/AccountMenu";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import MenuPanel from "@/components/home/MenuPanel";
import { dashboardFor, profilePageFor, useSignedInUser } from "@/lib/session";

// Top bar: logo, language toggle, the menu button and the account avatar.
// The page links live in the menu panel, on every screen size.
export default function FarmerNav() {
  const t = useTranslations("nav");
  // Checked once here and shared with the menu panel, which shows account actions too
  const [user, setUser] = useSignedInUser();

  // A member's way back in: their dashboard, and their profile when the role has one
  const profileHref = user ? profilePageFor(user.role) : null;
  const accountLinks = user
    ? [
        { href: dashboardFor(user.role), label: t("account.dashboard") },
        ...(profileHref ? [{ href: profileHref, label: t("account.profile") }] : []),
      ]
    : [];

  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Logo />

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {/* Bar button that opens the full menu panel: page links, account actions and Expert Advice */}
        <MenuPanel user={user} onSignedOut={() => setUser(null)} />
        <AccountMenu
          user={user}
          links={accountLinks}
          onSignedOut={() => setUser(null)}
          circleClassName="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        />
      </div>
    </header>
  );
}
