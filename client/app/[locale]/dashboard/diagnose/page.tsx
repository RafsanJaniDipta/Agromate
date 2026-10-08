import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DiagnoseSection from "@/components/dashboard/diagnose/DiagnoseSection";
import { ChevronDownIcon } from "@/components/icons";

// Keys under "dashboard.diagnosePage.tips" in the translations
const PHOTO_TIPS = ["daylight", "close", "sharp", "onePart"] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/diagnose">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("diagnoseTitle") };
}

// Crop disease check, kept simple: a short heading, one card for the photo and the answer,
// photo tips folded away, then the farmer's earlier checks.
export default async function DiagnosePage({ params }: PageProps<"/[locale]/dashboard/diagnose">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.diagnosePage" });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="px-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
      </header>

      <DiagnoseSection
        tips={
          // Folded by default; most farmers only need it once
          <details className="group px-1 text-sm">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-white/70 transition hover:text-white">
              <ChevronDownIcon className="size-4 -rotate-90 transition group-open:rotate-0" />
              {t("tipsTitle")}
            </summary>
            <ul className="mt-3 grid gap-x-6 gap-y-2 pl-6 text-white/65 sm:grid-cols-2">
              {PHOTO_TIPS.map((tip) => (
                <li key={tip} className="list-disc">
                  {t(`tips.${tip}`)}
                </li>
              ))}
            </ul>
          </details>
        }
      />
    </div>
  );
}
