import Image from "next/image";
import { useTranslations } from "next-intl";
import { LeafIcon, SparkIcon } from "@/components/icons";

// Photo with the company story, followed by mission and vision cards.
export default function StorySection() {
  const t = useTranslations("aboutPage");

  return (
    <section className="bg-white p-2 text-zinc-900 md:p-3">
      <div className="site-container py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl">
            <Image
              src="/images/farmers/farmer-tablet-drone.jpg"
              alt={t("storyImageAlt")}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <span className="inline-block rounded-full border border-zinc-200 px-4 py-1.5 text-xs">
              {t("storyBadge")}
            </span>
            <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              {t("storyTitle")}
            </h2>
            <p className="mt-6 text-zinc-600">{t("storyP1")}</p>
            <p className="mt-4 text-zinc-600">{t("storyP2")}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
          <div className="rounded-3xl bg-brand p-8 text-white">
            <LeafIcon className="size-8" />
            <h3 className="mt-6 text-2xl font-semibold">{t("mission.title")}</h3>
            <p className="mt-3 text-white/85">{t("mission.text")}</p>
          </div>
          <div className="rounded-3xl bg-zinc-100 p-8">
            <SparkIcon className="size-8 text-brand" />
            <h3 className="mt-6 text-2xl font-semibold">{t("vision.title")}</h3>
            <p className="mt-3 text-zinc-600">{t("vision.text")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
