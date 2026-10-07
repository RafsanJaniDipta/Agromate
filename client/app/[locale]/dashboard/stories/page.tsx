import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import MyStories from "@/components/dashboard/stories/MyStories";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/stories">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("storiesTitle") };
}

// Farmer's success stories: share one for the home page and follow its review.
export default async function StoriesPage({ params }: PageProps<"/[locale]/dashboard/stories">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.storiesPage" });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="px-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
      </header>

      <MyStories />
    </div>
  );
}
