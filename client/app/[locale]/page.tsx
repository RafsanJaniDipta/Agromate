import { resolveLocale } from "@/i18n/params";
import AboutSection from "@/components/home/AboutSection";
import ExpertsSection from "@/components/home/ExpertsSection";
import FarmerHero from "@/components/home/FarmerHero";
import SolutionsSection from "@/components/home/SolutionsSection";
import SuccessStoriesSection from "@/components/home/SuccessStoriesSection";
import WhyChooseSection from "@/components/home/WhyChooseSection";
import { getPublicExperts } from "@/lib/expert";
import { getHomeStories } from "@/lib/successStories";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  // If the API is down the page still renders: the stories and experts sections are left out
  const [approvedStories, experts] = await Promise.all([
    getHomeStories(locale).catch(() => []),
    getPublicExperts(),
  ]);

  return (
    <>
      <FarmerHero />
      <AboutSection />
      <SolutionsSection />
      <WhyChooseSection />
      <ExpertsSection experts={experts} />
      <SuccessStoriesSection stories={approvedStories} />
    </>
  );
}
