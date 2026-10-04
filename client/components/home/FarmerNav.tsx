"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";
import MenuPanel from "@/components/home/MenuPanel";
import { navLinks } from "@/components/home/navLinks";

// Top bar: logo, white pill menu (desktop), language toggle and the menu button.
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
        {/* Bar button that opens the full menu panel; Log in and Expert Advice live inside it */}
        <MenuPanel />
      </div>
    </header>
  );
}
