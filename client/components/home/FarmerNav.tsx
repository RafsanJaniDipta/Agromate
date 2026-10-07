"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import AccountMenu from "@/components/shared/AccountMenu";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import MenuPanel from "@/components/home/MenuPanel";
import { navLinks } from "@/components/home/navLinks";
import { dashboardFor, profilePageFor, useSignedInUser } from "@/lib/session";

// Top bar: logo, white pill menu (desktop), language toggle, the menu button and the account avatar.
export default function FarmerNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
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

  // The link for the current page; -1 when the page isn't in the menu
  const activeIndex = navLinks.findIndex(({ href }) => href === pathname);

  // The green pill sits on the hovered link, or on the current page's link when idle.
  const highlighted = hovered ?? activeIndex;

  useEffect(() => {
    const item = itemRefs.current[highlighted];
    setPill(item ? { left: item.offsetLeft, width: item.offsetWidth } : null);
  }, [highlighted]);

  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <Logo />

      <nav
        aria-label={t("label")}
        className="hidden rounded-full bg-white p-1.5 text-sm text-zinc-700 md:block"
      >
        <ul
          className="relative flex items-center"
          onMouseLeave={() => setHovered(null)}
        >
          {/* Sliding background */}
          {pill && (
            <span
              aria-hidden
              className="absolute inset-y-0 rounded-full bg-brand transition-all duration-300 ease-out"
              style={{ left: pill.left, width: pill.width }}
            />
          )}

          {navLinks.map(({ href, key }, index) => (
            <li
              key={key}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onMouseEnter={() => setHovered(index)}
              className="relative"
            >
              <Link
                href={href}
                className={`block rounded-full px-4 py-2 transition-colors duration-300 ${
                  highlighted === index ? "text-white" : ""
                } ${!pill && index === activeIndex ? "bg-brand text-white" : ""}`}
              >
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {/* Bar button that opens the full menu panel; account actions and Expert Advice live inside it */}
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
