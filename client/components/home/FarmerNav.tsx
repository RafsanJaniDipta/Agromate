"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import ArrowIcon from "@/components/shared/ArrowIcon";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";

// Home page sections, reachable from any page
const homeSection = (hash: string) => ({ pathname: "/", hash });

const navLinks = [
  { href: "/", key: "home" },
  { href: homeSection("services"), key: "services" },
  { href: homeSection("stories"), key: "stories" },
  { href: "/about", key: "about" },
  { href: "/support", key: "support" },
] as const;

// Top bar: logo, white pill menu, language toggle and the main call to action.
export default function FarmerNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

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
        <Link
          href="/login"
          className="hidden text-sm font-medium text-white/90 transition hover:text-white sm:block"
        >
          {t("login")}
        </Link>
        {/* Hidden on small phones so the logo and language toggle fit */}
        <Link
          href="/support"
          className="group hidden items-center gap-3 rounded-full bg-brand py-1 pl-5 pr-1 text-sm font-medium text-white transition hover:opacity-90 sm:inline-flex"
        >
          {t("expertAdvice")}
          <ArrowIcon />
        </Link>
      </div>
    </header>
  );
}
