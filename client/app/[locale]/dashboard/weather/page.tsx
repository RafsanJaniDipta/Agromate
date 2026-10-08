import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DashCard from "@/components/dashboard/DashCard";
import WeatherExplorer from "@/components/dashboard/weather/WeatherExplorer";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/weather">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("weatherTitle") };
}

// Farmer's weather page: pick a place, then today in detail and the next 7 days with farming tips.
export default async function WeatherPage({ params }: PageProps<"/[locale]/dashboard/weather">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.weatherPage" });

  return (
    <WeatherExplorer
      header={
        <DashCard className="flex flex-col justify-center">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-white/70">{t("intro")}</p>
        </DashCard>
      }
    />
  );
}
