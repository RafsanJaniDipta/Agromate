"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LogoutIcon, UserIcon } from "@/components/icons";
import UserAvatar from "@/components/shared/UserAvatar";
import { Link } from "@/i18n/navigation";
import { signOut, type CurrentUser } from "@/lib/session";

export type AccountLink = { href: string; label: string };

type AccountMenuProps = {
  // undefined while checking, null for a visitor
  user: CurrentUser | null | undefined;
  // Menu entries above "Log out", e.g. dashboard and profile
  links: AccountLink[];
  // Runs after logging out, e.g. to show the visitor view or leave the dashboard
  onSignedOut: () => void;
  // Same look as the buttons next to it
  circleClassName: string;
};

const menuItem = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white/10";

// Top-right avatar with a small account menu (name, role, links, log out).
// A visitor gets a person icon that leads to the login page instead.
// Used by both the website header and the dashboard top bar.
export default function AccountMenu({ user, links, onSignedOut, circleClassName }: AccountMenuProps) {
  const t = useTranslations("nav.account");
  const tRoles = useTranslations("roles");
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Closes on a click outside the menu or on Escape
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  // Keeps the spot so the header doesn't jump when the check finishes
  if (user === undefined) return <span aria-hidden className="size-10 shrink-0 rounded-full bg-white/10" />;

  if (user === null) {
    return (
      <Link href="/login" aria-label={t("login")} className={circleClassName}>
        <UserIcon className="size-5" />
      </Link>
    );
  }

  async function handleSignOut() {
    setIsOpen(false);
    // Leave even if the server call fails; the session expires on its own
    await signOut().catch(() => {});
    onSignedOut();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("menuLabel", { name: user.name })}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="block rounded-full ring-2 ring-white/30 transition hover:ring-white/60"
      >
        <UserAvatar name={user.name} image={user.image} size={40} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-3xl border border-white/10 bg-zinc-950/95 p-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-3">
            <UserAvatar name={user.name} image={user.image} size={44} />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="text-xs text-white/60">{tRoles(user.role)}</p>
            </div>
          </div>

          <ul className="mt-2 flex flex-col">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} onClick={() => setIsOpen(false)} className={menuItem}>
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={handleSignOut} className={`${menuItem} w-full text-red-300`}>
                <LogoutIcon className="size-4" />
                {t("signOut")}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
