"use client";

import { useLocale, useTranslations, type Locale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Each language is labelled in its own script
const labels: Record<Locale, string> = { en: "EN", bn: "বাং" };

// EN | বাং toggle that opens the current page in the other language.
export default function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex rounded-full border border-white/20 bg-white/10 p-1 text-xs backdrop-blur-md"
    >
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            locale === current ? "bg-white text-zinc-900" : "text-white/80 hover:text-white"
          }`}
        >
          {labels[locale]}
        </Link>
      ))}
    </div>
  );
}
