import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DashCard from "@/components/dashboard/DashCard";
import MyCrops from "@/components/dashboard/myCrops/MyCrops";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/my-crops">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("myCropsTitle") };
}

// Farmer's planted crops (crop cycles): what grows on which field and when it's due for harvest.
export default async function MyCropsPage({ params }: PageProps<"/[locale]/dashboard/my-crops">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.myCropsPage" });

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">{t("intro")}</p>
      </DashCard>

      <MyCrops />
    </div>
  );
}
