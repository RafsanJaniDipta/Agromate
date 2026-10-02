import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import GlassCard from "@/components/home/GlassCard";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Logo from "@/components/shared/Logo";

const avatars = [
  "/images/farmers/farmer-portrait.jpg",
  "/images/farmers/farmer-cornfield.jpg",
  "/images/farmers/farmer-harvesting-greens.jpg",
];

// Shared frame for the login and register pages: photo panel on the left, form on the right.
// On phones the photo shrinks to a short banner above the form.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth");

  return (
    <section className="p-2 md:p-3">
      <div className="grid min-h-[calc(100svh-1rem)] gap-2 md:min-h-[calc(100svh-1.5rem)] md:gap-3 lg:grid-cols-2">
        <div className="relative isolate flex min-h-56 flex-col overflow-hidden rounded-3xl p-6 text-white md:p-10">
          <Image
            src="/images/farmers/farmer-tablet-drone.jpg"
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="-z-10 animate-hero-zoom object-cover"
          />
          {/* Same green tint as the home hero, so text stays readable */}
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-black/80 via-emerald-950/70 to-black/50" />

          <div className="flex items-center justify-between gap-4">
            <Logo />
            <LanguageSwitcher />
          </div>

          <div className="mt-auto animate-blur-in pt-10">
            <h2 className="max-w-md text-2xl font-semibold leading-tight tracking-tight md:text-4xl xl:text-5xl">
              {t("panelTitle")}
            </h2>
            <p className="mt-4 hidden max-w-md text-white/85 lg:block">{t("panelText")}</p>

            <GlassCard className="mt-8 hidden w-fit items-center gap-4 p-4 lg:flex">
              <div className="flex -space-x-3">
                {avatars.map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full border-2 border-white/80 object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-white/80">
                <span className="block text-xl font-semibold text-white">{t("panelStat")}</span>
                {t("panelStatLabel")}
              </p>
            </GlassCard>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-zinc-100 p-6 text-zinc-900 md:p-10">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-900"
          >
            <ArrowLeftIcon className="size-4" />
            {t("backHome")}
          </Link>

          <div className="m-auto w-full max-w-md animate-blur-in py-10 [animation-delay:150ms]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
