import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import AdvicePage from "@/components/dashboard/advice/AdvicePage";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/advice">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adviceTitle") };
}

// Which crops suit the farmer's land this month, and how much fertilizer a crop needs.
export default async function Page({ params }: PageProps<"/[locale]/dashboard/advice">) {
  await resolveLocale(params);
  return <AdvicePage />;
}
