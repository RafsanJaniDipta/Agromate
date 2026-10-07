"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useLenis } from "lenis/react";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowRightIcon, CloseIcon, MenuIcon } from "@/components/icons";
import ArrowIcon from "@/components/shared/ArrowIcon";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import { navLinks } from "@/components/home/navLinks";
import { dashboardFor, signOut, type CurrentUser } from "@/lib/session";

// Same easing as the site's blur-in animation
const panelEasing = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// Log in and Create account share this outlined pill style
const outlineButton =
  "rounded-full border border-white/15 py-2.5 text-center text-sm font-medium transition hover:border-white/40 hover:bg-white/5";

// True only in the browser, so the portal never renders during SSR
const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// Fade-and-drop for the panel's items; `order` staggers them one after another
function revealStyles(isOpen: boolean, order: number) {
  return {
    className: `transition duration-500 motion-reduce:transition-none ${panelEasing} ${
      isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
    }`,
    style: { transitionDelay: isOpen ? `${150 + order * 60}ms` : "0ms" },
  };
}

type MenuPanelProps = {
  // undefined while checking, null for a visitor
  user: CurrentUser | null | undefined;
  onSignedOut: () => void;
};

// Site menu for every screen size: the bar button drops a dark panel from the top; the cross closes it.
// Visitors get Log in / Create account; signed-in members get their dashboard and Log out instead.
export default function MenuPanel({ user, onSignedOut }: MenuPanelProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const lenis = useLenis();
  const isClient = useIsClient();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openMenu = () => {
    setIsOpen(true);
    lenis?.stop(); // Lock page scroll behind the panel
  };

  // Lenis restarts right away, so a #section link clicked in the panel can still scroll
  const closeMenu = () => {
    setIsOpen(false);
    lenis?.start();
    menuButtonRef.current?.focus();
  };

  const actionsReveal = revealStyles(isOpen, navLinks.length);

  async function handleSignOut() {
    closeMenu();
    // The visitor view is right even if the server call fails; the session expires on its own
    await signOut().catch(() => {});
    onSignedOut();
  }

  // Move focus into the panel when it opens, so keyboard users land inside it
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        onClick={openMenu}
        aria-label={t("openMenu")}
        aria-expanded={isOpen}
        aria-controls="site-menu"
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
      >
        <MenuIcon className="size-5" />
      </button>

      {/* Rendered in <body> so the hero's overflow and stacking can't clip or cover it */}
      {isClient &&
        createPortal(
          <div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("label")}
            inert={!isOpen}
            onKeyDown={(event) => event.key === "Escape" && closeMenu()}
            className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
          >
            {/* Dimmed backdrop; tapping it also closes the menu */}
            <div
              aria-hidden
              onClick={closeMenu}
              className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* The panel slides down from above the screen */}
            <div
              data-lenis-prevent
              className={`absolute inset-x-0 top-0 max-h-svh overflow-y-auto rounded-b-3xl bg-zinc-950 text-white shadow-2xl transition-transform duration-500 motion-reduce:transition-none ${panelEasing} ${
                isOpen ? "translate-y-0" : "-translate-y-full"
              }`}
            >
              {/* Top bar copies the header's spacing, so the cross sits where the bar button was */}
              <div className="border-b border-white/10 bg-white/5 px-2 pt-2 md:px-3 md:pt-3">
                <div className="site-container flex items-center justify-between gap-4 py-6">
                  <Logo />
                  <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={closeMenu}
                      aria-label={t("closeMenu")}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
                    >
                      <CloseIcon className="size-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Links on the left, account actions on the right; stacked on phones */}
              <div className="px-2 md:px-3">
                <div className="site-container grid gap-10 py-8 md:grid-cols-2 md:gap-16 md:py-14">
                  <nav aria-label={t("label")}>
                    <ul>
                      {navLinks.map(({ href, key }, index) => {
                        const isCurrentPage = href === pathname;
                        const reveal = revealStyles(isOpen, index);

                        return (
                          <li
                            key={key}
                            style={reveal.style}
                            className={`border-b border-white/10 ${reveal.className}`}
                          >
                            <Link
                              href={href}
                              onClick={closeMenu}
                              aria-current={isCurrentPage ? "page" : undefined}
                              className={`group flex items-center justify-between py-4 text-3xl font-medium tracking-tight transition-colors md:py-5 md:text-4xl ${
                                isCurrentPage ? "text-lime-400" : "hover:text-lime-400"
                              }`}
                            >
                              {t(key)}
                              {/* Arrow slides in on hover */}
                              <ArrowRightIcon className="size-6 -translate-x-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>

                  {/* Compact buttons pinned to the right on desktop; drop in right after the last link */}
                  <div
                    style={actionsReveal.style}
                    className={`flex w-full flex-col gap-2.5 md:max-w-xs md:justify-self-end md:pt-5 ${actionsReveal.className}`}
                  >
                    {user ? (
                      <>
                        <Link href={dashboardFor(user.role)} onClick={closeMenu} className={outlineButton}>
                          {t("account.dashboard")}
                        </Link>
                        <button type="button" onClick={handleSignOut} className={outlineButton}>
                          {t("account.signOut")}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" onClick={closeMenu} className={outlineButton}>
                          {t("login")}
                        </Link>
                        <Link href="/register" onClick={closeMenu} className={outlineButton}>
                          {t("register")}
                        </Link>
                      </>
                    )}
                    <Link
                      href="/support"
                      onClick={closeMenu}
                      className="group flex items-center justify-between rounded-full bg-brand py-1 pl-5 pr-1 text-sm font-medium transition hover:opacity-90"
                    >
                      {t("expertAdvice")}
                      <ArrowIcon />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
