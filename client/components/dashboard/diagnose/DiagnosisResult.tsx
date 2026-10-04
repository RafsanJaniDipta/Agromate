"use client";

import { useTranslations } from "next-intl";
import type { DiagnosisState } from "@/components/dashboard/diagnose/useDiagnosis";

type DiagnosisResultProps = {
  diagnosis: DiagnosisState;
};

// Gemini's answer (crop, problem, certainty, signs, next steps) or the error message.
// Renders nothing until a check has finished.
export default function DiagnosisResult({ diagnosis }: DiagnosisResultProps) {
  const t = useTranslations("dashboard.diagnose");
  const { status, result, error } = diagnosis;

  if (status === "error" && error) {
    return (
      <p role="alert" className="text-sm text-red-300">
        {t(`errors.${error}`)}
      </p>
    );
  }

  if (status !== "done" || !result) return null;

  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      {!result.isPlant ? (
        <p className="text-sm text-amber-200">{t("notPlant")}</p>
      ) : (
        <>
          <div>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${
                result.healthy ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {result.healthy ? t("resultHealthy") : t("resultDisease")}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {result.crop ? `${result.crop} · ` : ""}
              {result.healthy ? t("healthy") : result.disease}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {t("confidenceLabel")}: {t(`confidenceLevels.${result.confidence}`)}
            </p>
          </div>

          {result.confidence === "low" && <p className="text-sm text-amber-200">{t("lowConfidence")}</p>}

          {result.symptoms && <p className="text-sm text-white/80">{result.symptoms}</p>}

          {result.advice.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/60">{t("advice")}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-white/85">
                {result.advice.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-white/50">{t("disclaimer")}</p>
    </div>
  );
}
