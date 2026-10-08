import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DashCard from "@/components/dashboard/DashCard";
import CropCatalog from "@/components/dashboard/crops/CropCatalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/crops">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("cropsTitle") };
}

// Farmer's crop guide: what each crop needs and how long it takes to grow.
export default async function CropsPage({ params }: PageProps<"/[locale]/dashboard/crops">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.cropsPage" });

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">{t("intro")}</p>
      </DashCard>

      <CropCatalog />
    </div>
  );
}
