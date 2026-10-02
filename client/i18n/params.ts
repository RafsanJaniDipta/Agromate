import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "./routing";

// Reads the [locale] route param: 404s on unknown languages and enables static rendering for the rest
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}
