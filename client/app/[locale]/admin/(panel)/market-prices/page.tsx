import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import PriceManager from "@/components/admin/prices/PriceManager";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/market-prices">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adminMarketPricesTitle") };
}

export default async function AdminMarketPricesPage({ params }: PageProps<"/[locale]/admin/market-prices">) {
  await resolveLocale(params);
  return <PriceManager />;
}
