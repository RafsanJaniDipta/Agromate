import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DashCard from "@/components/dashboard/DashCard";
import FarmAnalytics from "@/components/dashboard/analytics/FarmAnalytics";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/analytics">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("analyticsTitle") };
}

// Farmer's analytics: a year's income and costs, where the money went, and what grows where.
export default async function AnalyticsPage({ params }: PageProps<"/[locale]/dashboard/analytics">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.analyticsPage" });

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">{t("intro")}</p>
      </DashCard>

      <FarmAnalytics />
    </div>
  );
}
