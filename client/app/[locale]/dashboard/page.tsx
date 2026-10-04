import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import { getDashboard } from "@/lib/dashboard";
import DailyTasksCard from "@/components/dashboard/DailyTasksCard";
import FieldMapCard from "@/components/dashboard/FieldMapCard";
import HarvestChart from "@/components/dashboard/HarvestChart";
import {
  EquipmentCard,
  RevenueCard,
  WaterUsageCard,
  YieldCard,
} from "@/components/dashboard/StatCards";
import WeatherWidget from "@/components/dashboard/WeatherWidget";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("dashboardTitle") };
}

// Farm dashboard home. All numbers come from getDashboard(), so going live with the API
// only means switching off the sample data in lib/dashboard.ts.
export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  await resolveLocale(params);
  const cookieStore = await cookies();
  const { weather, fields, tasks, stats, harvest } = await getDashboard(cookieStore.toString());

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      {/* Left column: weather and today's tasks */}
      <div className="flex flex-col gap-5">
        <WeatherWidget weather={weather} />
        <DailyTasksCard initialTasks={tasks} />
      </div>

      {/* Right column: field map, KPI row and harvest chart */}
      <div className="flex min-w-0 flex-col gap-5">
        <FieldMapCard fields={fields} />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <YieldCard stat={stats.yield} />
          <WaterUsageCard stat={stats.water} />
          <EquipmentCard stat={stats.equipment} />
          <RevenueCard stat={stats.revenue} />
        </div>

        <HarvestChart months={harvest} />
      </div>
    </div>
  );
}
