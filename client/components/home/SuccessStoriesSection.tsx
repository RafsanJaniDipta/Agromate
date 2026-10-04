"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPinIcon, QuoteIcon } from "@/components/icons";
import SliderButtons from "@/components/home/SliderButtons";

type Story = {
  id: string;
  image: string;
  focus: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  yield: string;
  cost: string;
  income: string;
};

// Sample stories: swap in real farmers (with their consent), quotes and numbers before launch.
// Photos are free Pexels stock shot in Bangladesh, e.g. pexels.com/photo/36062685.
// `focus` is the face's position, so round avatar crops keep the face in view.
// Text for each id lives in messages under stories.items
const storyImages = [
  { id: "shafiqul", image: "/images/farmers/farmer-spreading-fertilizer.jpg", focus: "52% 25%" },
  { id: "karim", image: "/images/farmers/farmer-carrying-paddy.jpg", focus: "48% 30%" },
  { id: "nurul", image: "/images/farmers/farmer-jute-harvest.jpg", focus: "60% 28%" },
  { id: "jamal", image: "/images/farmers/farmer-rice-field-portrait.jpg", focus: "57% 28%" },
] as const;

// Big photo; stories crossfade into each other, with the yield result pinned at the bottom.
function StoryPhoto({ stories, active }: { stories: Story[]; active: Story }) {
  const t = useTranslations("stories");

  return (
    <div className="relative isolate min-h-80 overflow-hidden rounded-3xl lg:min-h-120">
      {stories.map((story) => (
        <Image
          key={story.id}
          src={story.image}
          style={{ objectPosition: story.focus }}
          alt={story.id === active.id ? story.name : ""}
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className={`-z-10 object-cover transition duration-1000 ${
            story.id === active.id ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

      {/* key replays the blur-in each time the story changes */}
      <div key={active.id} className="flex h-full flex-col justify-between p-5 md:p-6">
        <span className="inline-flex animate-blur-in items-center gap-1.5 self-start rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs backdrop-blur-md">
          <MapPinIcon className="size-3.5" />
          {active.location}
        </span>

        <div className="mt-auto animate-blur-in self-start rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md [animation-delay:150ms]">
          <p className="text-4xl font-semibold tracking-tight text-lime-400 md:text-5xl">
            {active.yield}
          </p>
          <p className="mt-1 text-xs text-white/75">{t("yieldLabel")}</p>
        </div>
      </div>
    </div>
  );
}

// Quote, farmer details and the cost and income results.
function StoryQuote({ story }: { story: Story }) {
  const t = useTranslations("stories");
  const results = [
    { value: story.cost, label: t("costLabel") },
    { value: story.income, label: t("incomeLabel") },
  ];

  return (
    <figure className="flex flex-col justify-between gap-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-10">
      <QuoteIcon className="size-10 text-lime-400" />

      {/* key replays the blur-in each time the story changes */}
      <div key={story.id} className="flex flex-1 flex-col justify-between gap-10">
        <blockquote className="animate-blur-in text-xl font-medium leading-relaxed md:text-2xl">
          {story.quote}
        </blockquote>

        <div className="animate-blur-in [animation-delay:150ms]">
          <figcaption className="flex items-center gap-3">
            <Image
              src={story.image}
              style={{ objectPosition: story.focus }}
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-full object-cover ring-2 ring-lime-400/60"
            />
            <div>
              <p className="font-medium">{story.name}</p>
              <p className="text-sm text-white/60">
                {story.role} · {story.location}
              </p>
            </div>
          </figcaption>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
            {results.map(({ value, label }) => (
              <div key={label}>
                <dt className="text-xs text-white/60">{label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </figure>
  );
}

type StoryPickerProps = {
  stories: Story[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onTimerEnd: () => void;
};

// One button per farmer. The active one fills a timer bar; when it ends the next story shows.
// Hovering or focusing the section pauses the timer.
function StoryPicker({ stories, activeIndex, onSelect, onTimerEnd }: StoryPickerProps) {
  const t = useTranslations("stories");

  return (
    <ul aria-label={t("pickerLabel")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stories.map((story, index) => {
        const isActive = index === activeIndex;

        return (
          <li key={story.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={isActive ? "true" : undefined}
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition ${
                isActive
                  ? "border-white/20 bg-white/10"
                  : "border-white/10 opacity-60 hover:bg-white/5 hover:opacity-100"
              }`}
            >
              <Image
                src={story.image}
                style={{ objectPosition: story.focus }}
                alt=""
                width={44}
                height={44}
                className="size-11 shrink-0 rounded-full object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{story.name}</span>
                <span className="block truncate text-xs text-white/60">{story.role}</span>
              </span>

              {isActive && (
                <span
                  aria-hidden
                  onAnimationEnd={onTimerEnd}
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-story-progress bg-lime-400 group-hover/stories:[animation-play-state:paused] group-focus-within/stories:[animation-play-state:paused]"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Farmer testimonials: photo and quote side by side, switched by the picker or arrows.
export default function SuccessStoriesSection() {
  const t = useTranslations("stories");
  const [activeIndex, setActiveIndex] = useState(0);

  const stories: Story[] = storyImages.map(({ id, image, focus }) => ({
    id,
    image,
    focus,
    name: t(`items.${id}.name`),
    role: t(`items.${id}.role`),
    location: t(`items.${id}.location`),
    quote: t(`items.${id}.quote`),
    yield: t(`items.${id}.yield`),
    cost: t(`items.${id}.cost`),
    income: t(`items.${id}.income`),
  }));
  const count = stories.length;
  const activeStory = stories[activeIndex];

  const showPrevious = () => setActiveIndex((activeIndex - 1 + count) % count);
  const showNext = () => setActiveIndex((activeIndex + 1) % count);

  return (
    <section id="stories" className="bg-white p-2 md:p-3">
      <div className="group/stories relative isolate overflow-hidden rounded-3xl bg-emerald-950 py-16 text-white md:py-24">
        {/* Soft green glows behind the content */}
        <div aria-hidden className="absolute -right-32 -top-40 -z-10 size-128 rounded-full bg-brand/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-48 -left-32 -z-10 size-112 rounded-full bg-lime-500/10 blur-3xl" />

        <div className="site-container">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs">
                {t("badge")}
              </span>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                {t.rich("title", {
                  accent: (chunks) => <span className="text-lime-400">{chunks}</span>,
                })}
              </h2>
              <p className="mt-4 max-w-lg text-sm text-white/70 md:text-base">{t("intro")}</p>
            </div>
            <SliderButtons onPrev={showPrevious} onNext={showNext} />
          </div>

          <div data-reveal className="mt-12 grid gap-4 [--i:1] lg:grid-cols-[1fr_1.15fr]">
            <StoryPhoto stories={stories} active={activeStory} />
            <StoryQuote story={activeStory} />
          </div>

          <div data-reveal className="mt-4 [--i:2]">
            <StoryPicker
              stories={stories}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              onTimerEnd={showNext}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
