"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ArrowIcon from "@/components/shared/ArrowIcon";
import { SparkIcon } from "@/components/icons";
import SliderButtons from "@/components/home/SliderButtons";

type Solution = {
  title: string;
  image: string;
  tag: string;
  stat: string;
  description: string;
};

// Text for each id lives in messages under solutions.items
const solutionImages = [
  { id: "precision", image: "/images/farmers/farmer-tablet-drone.jpg" },
  { id: "irrigation", image: "/images/fields/sprinkler-irrigation.jpg" },
  { id: "monitoring", image: "/images/technology/weather-station.jpg" },
  { id: "machinery", image: "/images/technology/autonomous-sprayer.jpg" },
] as const;

function ActiveCard({ solution }: { solution: Solution }) {
  const t = useTranslations("solutions");

  return (
    <article className="flex h-full flex-col gap-6 p-4 md:flex-row">
      <div className="relative h-56 shrink-0 overflow-hidden rounded-2xl md:h-auto md:w-1/2">
        <Image
          src={solution.image}
          alt={solution.title}
          fill
          sizes="(min-width: 768px) 30vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-8 p-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full border border-zinc-200">
            <SparkIcon className="size-4 text-brand" />
          </span>
          <div>
            <p className="text-xs text-zinc-500">{solution.tag}</p>
            <p className="text-sm font-medium">{solution.stat}</p>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-medium tracking-tight">{solution.title}</h3>
          <p className="mt-2 text-sm text-zinc-500">{solution.description}</p>
          <Link
            href="/support"
            className="group mt-6 flex items-center justify-between gap-4 text-sm font-medium"
          >
            {t("learnMore", { title: solution.title })}
            <ArrowIcon className="size-9 bg-brand text-white" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CollapsedCard({ solution, onOpen }: { solution: Solution; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group relative block size-full text-left">
      <Image
        src={solution.image}
        alt=""
        fill
        sizes="20vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
      <h3 className="absolute inset-x-5 bottom-5 text-lg font-medium leading-snug text-white">
        {solution.title}
      </h3>
    </button>
  );
}

// Service slider: the active card opens wide, the rest stay as narrow photo cards.
export default function SolutionsSection() {
  const t = useTranslations("solutions");
  const [active, setActive] = useState(0);

  const solutions: Solution[] = solutionImages.map(({ id, image }) => ({
    image,
    title: t(`items.${id}.title`),
    tag: t(`items.${id}.tag`),
    stat: t(`items.${id}.stat`),
    description: t(`items.${id}.description`),
  }));
  const count = solutions.length;

  return (
    <section id="services" className="bg-white p-2 md:p-3">
      <div className="rounded-3xl bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-200 py-14 text-zinc-900 md:py-20">
        <div className="site-container">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-3xl font-medium leading-tight tracking-tight md:text-5xl">
              {t("titleLine1")} <br className="hidden md:block" />
              {t("titleLine2")}
            </h2>
            <SliderButtons
              onPrev={() => setActive((active - 1 + count) % count)}
              onNext={() => setActive((active + 1) % count)}
            />
          </div>

          {/* Revealed as one row: the cards animate their own width, so they can't carry data-reveal */}
          <div data-reveal className="mt-10 flex gap-4 [--i:1] md:h-96">
            {solutions.map((solution, index) => (
              // Same wrapper in both states so the width change animates.
              // Collapsed cards are hidden on mobile, where only the active card shows.
              <div
                key={solution.image}
                className={`min-w-0 overflow-hidden rounded-3xl transition-[flex-grow] duration-500 ${
                  index === active ? "flex-3 bg-white shadow-sm" : "hidden flex-1 md:block"
                }`}
              >
                {index === active ? (
                  <ActiveCard solution={solution} />
                ) : (
                  <CollapsedCard solution={solution} onOpen={() => setActive(index)} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
