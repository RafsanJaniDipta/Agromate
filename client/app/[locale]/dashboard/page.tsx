import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DailyTasksCard from "@/components/dashboard/DailyTasksCard";
import FarmOverview from "@/components/dashboard/FarmOverview";
import FarmPhotoCard from "@/components/dashboard/FarmPhotoCard";
import { RemindersSyncProvider } from "@/components/dashboard/RemindersSync";
import UpcomingCard from "@/components/dashboard/UpcomingCard";
import WeatherWidget from "@/components/dashboard/WeatherWidget";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("dashboardTitle") };
}

// Farm dashboard home. Each card loads its own data in the browser (with the login cookie),
// so one slow or failed source doesn't hold up the rest.
export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  await resolveLocale(params);

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      {/* Left column: weather, today's tasks and what's coming up.
          The two task cards share reminders, so adding one updates the other. */}
      <div className="flex flex-col gap-5">
        <WeatherWidget detailsHref="/dashboard/weather" />
        <RemindersSyncProvider>
          <DailyTasksCard />
          <UpcomingCard />
        </RemindersSyncProvider>
      </div>

      {/* Right column: farm photo, KPI row and the money chart */}
      <div className="flex min-w-0 flex-col gap-5">
        <FarmPhotoCard />
        <FarmOverview />
      </div>
    </div>
  );
}
