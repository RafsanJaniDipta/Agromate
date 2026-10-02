import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import PageHero from "@/components/shared/PageHero";
import SupportCta from "@/components/shared/SupportCta";
import StorySection from "@/components/about/StorySection";
import ValuesSection from "@/components/about/ValuesSection";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("aboutTitle") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  await resolveLocale(params);
  const t = await getTranslations("aboutPage");

  return (
    <>
      <PageHero
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        image="/images/fields/rice-terraces-aerial.jpg"
      />
      <StorySection />
      <ValuesSection />
      <SupportCta />
    </>
  );
}
