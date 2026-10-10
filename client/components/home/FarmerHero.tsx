import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ArrowIcon from "@/components/shared/ArrowIcon";
import FarmerNav from "@/components/home/FarmerNav";
import MarketPriceCard from "@/components/home/MarketPriceCard";
import WeatherCard from "@/components/home/WeatherCard";

// Home hero: video background, title on the left, market prices and weather on the right.
export default function FarmerHero() {
  const t = useTranslations("hero");

  return (
    <section className="p-2 md:p-3">
      {/* Fills the screen height, minus the section padding */}
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-3xl text-white md:min-h-[calc(100svh-1.5rem)]">
        {/* Muted + playsInline are required for autoplay on mobile; poster shows while loading.
            It settles from a slight zoom on load while the text below blurs in one by one. */}
        <video
          src="/video/hero-farm.mp4"
          poster="/images/banners/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full animate-hero-zoom object-cover"
        />
        {/* Dark green tint keeps the text readable on the photo */}
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-black/75 via-emerald-950/70 to-black/60" />

        <div className="site-container flex flex-1 flex-col pb-8">
          <FarmerNav />

          <div className="mt-8 grid flex-1 content-end items-end gap-8 lg:grid-cols-[1fr_380px]">
            <div>
              <h1 className="animate-blur-in text-5xl font-semibold leading-tight tracking-tighter sm:text-6xl lg:text-7xl">
                {t("titleLine1")}
                <br />
                <span className="font-bold text-lime-500">{t("titleLine2")}</span>
              </h1>

              <p className="mt-5 max-w-xl animate-blur-in text-white/90 [animation-delay:150ms] md:text-lg">
                {t("subtitle")}
              </p>

              <Link
                href="#services"
                className="group mt-8 inline-flex animate-blur-in items-center gap-3 rounded-full bg-brand py-1.5 pl-7 pr-1.5 text-sm font-medium transition [animation-delay:300ms] hover:opacity-90"
              >
                {t("cta")}
                <ArrowIcon />
              </Link>
            </div>

            <div className="flex animate-blur-in flex-col gap-4 [animation-delay:450ms]">
              <MarketPriceCard />
              <WeatherCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
