import Image from "next/image";
import { useTranslations } from "next-intl";
import { LogoMark, SparkIcon } from "@/components/icons";

// Placeholder partner names, swap for real partner logos
const partners = ["AgriCore", "GreenField", "FarmLink", "CropWise", "SoilTech", "HarvestHub"];

const avatars = [
  "/images/farmers/farmer-portrait.jpg",
  "/images/farmers/farmer-cornfield.jpg",
  "/images/farmers/farmer-tablet-drone.jpg",
];

const statIds = ["acres", "yield", "farmers"] as const;

// Partner strip, mission statement and impact numbers.
export default function AboutSection() {
  const t = useTranslations("about");

  return (
    <section id="about" className="bg-white p-2 text-zinc-900 md:p-3">
      <div className="site-container py-16 md:py-24">
        {/* Endless logo strip: the list is drawn twice and slides by half its width, so it
            loops without a jump. Edges fade out; hovering pauses it. */}
        <div
          data-reveal
          className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        >
          <ul className="flex w-max animate-marquee text-zinc-400 hover:[animation-play-state:paused]">
            {[...partners, ...partners].map((name, index) => (
              <li
                key={index}
                aria-hidden={index >= partners.length}
                className="flex items-center gap-2 pr-16 text-xl font-semibold"
              >
                <LogoMark className="size-6" />
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-[260px_1fr]">
          {/* On mobile this column drops below the main statement */}
          <div className="order-last flex flex-col justify-between gap-12 lg:order-first">
            <div data-reveal>
              <div className="flex -space-x-3">
                {avatars.map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500">{t("trustedBy")}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">
                {t("farmersCount")}{" "}
                <span className="text-xs font-normal text-zinc-500">{t("farmersLabel")}</span>
              </p>
            </div>

            <div data-reveal>
              <div className="flex gap-3">
                <Image
                  src="/images/farmers/farmer-harvesting-greens.jpg"
                  alt={t("harvestAlt")}
                  width={120}
                  height={120}
                  className="size-28 rounded-2xl object-cover"
                />
                <Image
                  src="/images/produce/cauliflower-harvest.jpg"
                  alt={t("produceAlt")}
                  width={120}
                  height={120}
                  className="size-28 rounded-2xl object-cover"
                />
              </div>
              <p className="mt-4 text-sm text-zinc-600">{t("caption")}</p>
            </div>
          </div>

          <div>
            <h2 data-reveal className="text-3xl font-medium leading-snug tracking-tight md:text-5xl md:leading-tight">
              {t.rich("heading", {
                image: () => (
                  <span className="relative inline-block h-[0.8em] w-[2em] overflow-hidden rounded-full align-middle">
                    <Image
                      src="/images/fields/rice-terraces-aerial.jpg"
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </span>
                ),
                muted: (chunks) => <span className="text-zinc-400">{chunks}</span>,
              })}
            </h2>

            <p data-reveal className="mt-8 max-w-2xl text-sm text-zinc-600 [--i:1]">
              {t("intro")}
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {statIds.map((id, index) => (
                <div
                  key={id}
                  data-reveal
                  style={{ "--i": index }}
                  className="flex min-h-56 flex-col justify-between rounded-3xl bg-zinc-100 p-6"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{t(`stats.${id}.title`)}</h3>
                    <SparkIcon className="size-4 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-5xl font-medium tracking-tight">{t(`stats.${id}.value`)}</p>
                    <p className="mt-2 text-xs text-zinc-500">{t(`stats.${id}.caption`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
