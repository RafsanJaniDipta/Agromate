import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import ExpertOverview from "@/components/expert/ExpertOverview";

export async function generateMetadata({ params }: PageProps<"/[locale]/expert">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("expertTitle") };
}

export default async function ExpertPage({ params }: PageProps<"/[locale]/expert">) {
  await resolveLocale(params);
  return <ExpertOverview />;
}
