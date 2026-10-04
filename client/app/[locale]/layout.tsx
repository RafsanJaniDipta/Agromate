import type { Metadata } from "next";
import { Anek_Bangla, Geist_Mono, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import { routing } from "@/i18n/routing";
import "../globals.css";
import Footer from "@/components/shared/Footer";
import HideOnDashboard from "@/components/shared/HideOnDashboard";
import ScrollReveal from "@/components/shared/ScrollReveal";
import SmoothScroll from "@/components/shared/SmoothScroll";

// Poppins isn't a variable font, so each weight in use must be listed
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Poppins has no Bangla letters; the browser falls back to this font for them.
// Variable font, so every weight is included. Not preloaded, so English pages never download it.
const anekBangla = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pre-render every page once per language
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });

  // hreflang alternate links are added as a response header by the next-intl proxy
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);

  return (
    <html
      lang={locale}
      className={`${poppins.variable} ${anekBangla.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <SmoothScroll>
            <main className="flex flex-1 flex-col">{children}</main>
            <HideOnDashboard>
              <Footer />
            </HideOnDashboard>
            <ScrollReveal />
          </SmoothScroll>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
