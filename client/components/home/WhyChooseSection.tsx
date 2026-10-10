import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ArrowIcon from "@/components/shared/ArrowIcon";
import WhyChooseCarousel from "@/components/home/WhyChooseCarousel";

const tagIds = ["agriTech", "smartFields", "ecoFarming"] as const;

// Featured practice card on the left, reasons to choose Agromate on the right.
export default function WhyChooseSection() {
  const t = useTranslations("whyChoose");

  return (
    <section id="why-us" className="bg-white p-2 text-zinc-900 md:p-3">
      <div className="site-container grid gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
        <Link
          href="#services"
          data-reveal
          className="group relative isolate flex min-h-112 flex-col justify-end overflow-hidden rounded-3xl p-6 text-white md:p-8"
        >
          <Image
            src="/images/fields/rice-terraces-aerial.jpg"
            alt={t("featureAlt")}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/75 via-black/20 to-transparent" />

          <ArrowIcon className="absolute right-6 top-6 size-11 bg-brand text-white" />

          <h3 className="text-3xl font-medium tracking-tight">{t("featureTitle")}</h3>
          <p className="mt-2 max-w-sm text-sm text-white/80">{t("featureText")}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {tagIds.map((id) => (
              <li
                key={id}
                className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs backdrop-blur-md"
              >
                {t(`tags.${id}`)}
              </li>
            ))}
          </ul>
        </Link>

        <div className="flex min-w-0 flex-col justify-between gap-10">
          <div data-reveal className="[--i:1]">
            <span className="inline-block rounded-full border border-zinc-200 px-4 py-1.5 text-xs">
              {t("badge")}
            </span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">{t("title")}</h2>
            <p className="mt-4 max-w-md text-sm text-zinc-600">{t("intro")}</p>
          </div>

          <WhyChooseCarousel />
        </div>
      </div>
    </section>
  );
}
