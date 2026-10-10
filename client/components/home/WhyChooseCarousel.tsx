"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import SliderButtons from "@/components/home/SliderButtons";

// Labels for each id live in messages under whyChoose.reasons
const reasons = [
  { id: "farmer", image: "/images/farmers/farmer-portrait.jpg" },
  { id: "tech", image: "/images/technology/hydroponic-seedlings.jpg" },
  { id: "yield", image: "/images/produce/carrot-harvest.jpg" },
  { id: "support", image: "/images/farmers/farmer-cornfield.jpg" },
] as const;

// Horizontally scrolling photo cards; the arrow buttons move one card at a time.
export default function WhyChooseCarousel() {
  const t = useTranslations("whyChoose.reasons");
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    const gap = 16;
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  return (
    <div>
      <div className="flex justify-end">
        <SliderButtons onPrev={() => scrollByCard(-1)} onNext={() => scrollByCard(1)} />
      </div>

      <ul
        ref={trackRef}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none]"
      >
        {reasons.map(({ id, image }, index) => (
          <li
            key={id}
            data-reveal
            style={{ "--i": index }}
            className="relative w-48 shrink-0 snap-start pt-4 md:w-52"
          >
            <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium shadow-sm">
              {t(id)}
            </span>
            <div className="relative h-64 overflow-hidden rounded-2xl">
              <Image src={image} alt={t(id)} fill sizes="208px" className="object-cover" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
