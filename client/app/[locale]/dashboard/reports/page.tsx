import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import FarmReport from "@/components/dashboard/reports/FarmReport";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/reports">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("reportsTitle") };
}

// Printable farm report: a year's or one crop's costs, harvests, sales and profit.
export default async function Page({ params }: PageProps<"/[locale]/dashboard/reports">) {
  await resolveLocale(params);
  return <FarmReport />;
}
