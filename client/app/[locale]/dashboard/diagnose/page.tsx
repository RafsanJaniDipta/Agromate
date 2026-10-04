import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import DiagnoseWorkspace from "@/components/dashboard/diagnose/DiagnoseWorkspace";
import { CheckIcon, ClipboardIcon, SunIcon } from "@/components/icons";

// Keys under "dashboard.diagnosePage" in the translations
const PHOTO_TIPS = ["daylight", "close", "sharp", "onePart"] as const;
const STEPS = ["photo", "check", "act"] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/diagnose">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("diagnoseTitle") };
}

// Crop disease section: how it works on top, then the photo on the left and
// Gemini's answer with photo tips on the right.
export default async function DiagnosePage({ params }: PageProps<"/[locale]/dashboard/diagnose">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.diagnosePage" });

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">{t("intro")}</p>
      </DashCard>

      <DashCard className="flex flex-col gap-4">
        <CardHeader icon={<ClipboardIcon />} title={t("stepsTitle")} />
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-black">
                {(index + 1).toLocaleString(locale)}
              </span>
              <p className="mt-3 font-medium">{t(`steps.${step}.title`)}</p>
              <p className="mt-1 text-sm text-white/70">{t(`steps.${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </DashCard>

      <DiagnoseWorkspace>
        <DashCard className="flex flex-col gap-4">
          <CardHeader icon={<SunIcon />} title={t("tipsTitle")} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {PHOTO_TIPS.map((tip) => (
              <li
                key={tip}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85"
              >
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                {t(`tips.${tip}`)}
              </li>
            ))}
          </ul>
        </DashCard>
      </DiagnoseWorkspace>
    </div>
  );
}
