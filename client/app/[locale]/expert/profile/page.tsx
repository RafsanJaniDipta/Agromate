import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import ExpertProfileForm from "@/components/expert/ExpertProfileForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/expert/profile">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("expertProfileTitle") };
}

export default async function ExpertProfilePage({ params }: PageProps<"/[locale]/expert/profile">) {
  await resolveLocale(params);
  return <ExpertProfileForm />;
}
