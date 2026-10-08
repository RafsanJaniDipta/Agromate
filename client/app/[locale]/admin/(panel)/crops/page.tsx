import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import CropManager from "@/components/admin/crops/CropManager";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/crops">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adminCropsTitle") };
}

export default async function AdminCropsPage({ params }: PageProps<"/[locale]/admin/crops">) {
  await resolveLocale(params);
  return <CropManager />;
}
