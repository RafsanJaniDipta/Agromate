import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import ExpertDirectory from "@/components/dashboard/experts/ExpertDirectory";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/experts">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("expertsTitle") };
}

// Farmer's expert directory: verified experts' profiles, each with a button to message them.
export default async function ExpertsPage({ params }: PageProps<"/[locale]/dashboard/experts">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.expertsPage" });

  return (
    <div className="flex flex-col gap-6">
      <header className="px-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
      </header>

      <ExpertDirectory />
    </div>
  );
}
