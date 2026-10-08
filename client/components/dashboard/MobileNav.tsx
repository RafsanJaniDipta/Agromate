"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { dashboardNav } from "@/components/dashboard/dashboardNav";
import type { Role } from "@/lib/session";

type MobileNavProps = {
  role: Role;
  // Same look as the other round buttons in the top bar
  buttonClassName: string;
};

// Phones have no room for the sidebar, so a menu button opens the same links in a drawer.
export default function MobileNav({ role, buttonClassName }: MobileNavProps) {
  const t = useTranslations("dashboard.sidebar");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { links, footerLinks } = dashboardNav[role];

  // Escape closes the drawer; the page behind doesn't scroll while it's open
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const linkList = (items: typeof links) => (
    <ul className="flex flex-col gap-2">
      {items.map(({ href, key, Icon }) => {
        const isActive = href === pathname;
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={() => setIsOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-12 items-center gap-4 rounded-2xl px-3 text-sm font-medium transition ${
                isActive ? "bg-white text-zinc-900" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="size-6 shrink-0" />
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={t("menu")}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
      >
        <MenuIcon className="size-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Tapping the dimmed page closes the drawer */}
          <button
            type="button"
            aria-label={t("closeMenu")}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <nav
            aria-label={t("label")}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between overflow-y-auto border-r border-white/10 bg-zinc-950/95 p-4 text-white"
          >
            <div className="flex flex-col gap-4">
              <button
                type="button"
                aria-label={t("closeMenu")}
                onClick={() => setIsOpen(false)}
                className={`${buttonClassName} self-end`}
              >
                <CloseIcon className="size-5" />
              </button>
              {linkList(links)}
            </div>
            <div className="mt-6">{linkList(footerLinks)}</div>
          </nav>
        </div>
      )}
    </div>
  );
}
