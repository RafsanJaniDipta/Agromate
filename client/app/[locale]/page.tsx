import { resolveLocale } from "@/i18n/params";
import AboutSection from "@/components/home/AboutSection";
import FarmerHero from "@/components/home/FarmerHero";
import SolutionsSection from "@/components/home/SolutionsSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";

export default async function Home({ params }: PageProps<"/[locale]">) {
  await resolveLocale(params);

  return (
    <>
      <FarmerHero />
      <AboutSection />
      <SolutionsSection />
      <WhyChooseSection />
      <SuccessStoriesSection />
    </>
  );
}
