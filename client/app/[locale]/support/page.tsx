import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import PageHero from "@/components/shared/PageHero";
import ContactChannels from "@/components/support/ContactChannels";
import FaqList from "@/components/support/FaqList";
import SupportForm from "@/components/support/SupportForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/support">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("supportTitle") };
}

export default async function SupportPage({ params }: PageProps<"/[locale]/support">) {
  await resolveLocale(params);
  const t = await getTranslations("supportPage");

  return (
    <>
      <PageHero
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        image="/images/farmers/farmer-cornfield.jpg"
      />

      <section className="bg-white p-2 text-zinc-900 md:p-3">
        <div className="site-container py-16 md:py-24">
          <ContactChannels />

          <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <SupportForm />
            <FaqList />
          </div>
        </div>
      </section>
    </>
  );
}
