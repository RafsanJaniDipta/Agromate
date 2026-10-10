"use client";

import { useTranslations } from "next-intl";
import type { DiagnosisState } from "@/components/dashboard/diagnose/useDiagnosis";

type DiagnosisResultProps = {
  diagnosis: DiagnosisState;
};

// Gemini's answer (crop and problem, how sure, signs, next steps) or the error message,
// plus whether it was saved to the history. Renders nothing until a check has finished.
export default function DiagnosisResult({ diagnosis }: DiagnosisResultProps) {
  const t = useTranslations("dashboard.diagnose");
  const { status, result, error, saveStatus, retrySave } = diagnosis;

  if (status === "error" && error) {
    return (
      <p role="alert" className="my-auto text-sm text-red-300">
        {t(`errors.${error}`)}
      </p>
    );
  }

  if (status !== "done" || !result) return null;

  if (!result.isPlant) {
    return <p className="my-auto text-sm text-amber-200">{t("notPlant")}</p>;
  }

  return (
    <div aria-live="polite" className="flex flex-col gap-5">
      {/* The finding first, large; certainty as a quiet line under it */}
      <div>
        <p className={`text-xs ${result.healthy ? "text-emerald-300" : "text-amber-300"}`}>
          {result.healthy ? t("resultHealthy") : t("resultDisease")}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{result.healthy ? t("healthy") : result.disease}</h2>
        <p className="mt-1 text-sm text-white/55">
          {[result.crop, `${t("confidenceLabel")}: ${t(`confidenceLevels.${result.confidence}`)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {result.confidence === "low" && <p className="text-sm text-amber-200">{t("lowConfidence")}</p>}

      {result.symptoms && <p className="text-sm leading-relaxed text-white/80">{result.symptoms}</p>}

      {result.advice.length > 0 && (
        <div>
          <p className="text-xs text-white/50">{t("advice")}</p>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {result.advice.map((step) => (
              <li key={step} className="flex gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                <span className="text-white/85">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3 text-xs">
        {/* Whether the check made it into the history below */}
        {saveStatus === "saving" && <p className="text-white/50">{t("saving")}</p>}
        {saveStatus === "saved" && <p className="text-emerald-300">{t("saved")}</p>}
        {saveStatus === "error" && (
          <p className="flex flex-wrap items-center gap-2 text-red-300">
            {t("saveError")}
            <button type="button" onClick={retrySave} className="underline hover:no-underline">
              {t("retrySave")}
            </button>
          </p>
        )}
        <p className="text-white/40">{t("disclaimer")}</p>
      </div>
    </div>
  );
}
