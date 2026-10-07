import { resolveLocale } from "@/i18n/params";
import AboutSection from "@/components/home/AboutSection";
import FarmerHero from "@/components/home/FarmerHero";
import SolutionsSection from "@/components/home/SolutionsSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import { getHomeStories } from "@/lib/successStories";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  // If the API is down the section still shows its sample stories
  const approvedStories = await getHomeStories(locale).catch(() => []);

  return (
    <>
      <FarmerHero />
      <AboutSection />
      <SolutionsSection />
      <WhyChooseSection />
      <SuccessStoriesSection realStories={approvedStories} />
    </>
  );
}
