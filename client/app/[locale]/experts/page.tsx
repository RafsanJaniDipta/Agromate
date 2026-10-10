import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import ExpertsDirectory from "@/components/experts/ExpertsDirectory";
import PageHero from "@/components/shared/PageHero";
import SupportCta from "@/components/shared/SupportCta";
import { getPublicExperts } from "@/lib/expert";

export async function generateMetadata({ params }: PageProps<"/[locale]/experts">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("expertsTitle") };
}

// Public list of every verified expert; the home page links here from "Our experts".
export default async function ExpertsPage({ params }: PageProps<"/[locale]/experts">) {
  await resolveLocale(params);
  const [t, experts] = await Promise.all([getTranslations("experts.page"), getPublicExperts()]);

  return (
    <>
      <PageHero title={t("heroTitle")} subtitle={t("heroSubtitle")} image="/images/farmers/farmer-tablet-drone.jpg" />
      <ExpertsDirectory experts={experts} />
      <SupportCta />
    </>
  );
}
