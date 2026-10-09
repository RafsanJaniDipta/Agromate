import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import MarketPrices from "@/components/dashboard/market/MarketPrices";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/market">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("marketTitle") };
}

// Farmer's market prices: crops (TCB, daily), fertilizer and pesticides, and what farmers report.
export default async function MarketPage({ params }: PageProps<"/[locale]/dashboard/market">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "prices" });

  return (
    <div className="flex flex-col gap-6">
      <header className="px-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
      </header>

      <MarketPrices />
    </div>
  );
}
