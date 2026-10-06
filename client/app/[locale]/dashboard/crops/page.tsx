import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import CropPlanner from "@/components/dashboard/crops/CropPlanner";
import { getCropsPage } from "@/lib/crops";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/crops">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("cropsTitle") };
}

// Crop planning: pick a crop, choose a field and a planting date, and AgroMate
// builds the whole growing plan (milestones + tasks) scaled to that window.
export default async function CropsPage({ params }: PageProps<"/[locale]/dashboard/crops">) {
  await resolveLocale(params);
  const cookieStore = await cookies();
  const { crops, cycles, fields, loadError } = await getCropsPage(cookieStore.toString());

  return <CropPlanner initialCycles={cycles} crops={crops} fields={fields} loadError={loadError} />;
}