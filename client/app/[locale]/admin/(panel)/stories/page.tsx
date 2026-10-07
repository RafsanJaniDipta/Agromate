import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DashCard from "@/components/dashboard/DashCard";
import StoryModeration from "@/components/admin/stories/StoryModeration";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/stories">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adminStoriesTitle") };
}

// Review farmers' success stories before they appear on the home page.
export default async function AdminStoriesPage({ params }: PageProps<"/[locale]/admin/stories">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "admin.stories" });

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">{t("intro")}</p>
      </DashCard>

      <StoryModeration />
    </div>
  );
}
