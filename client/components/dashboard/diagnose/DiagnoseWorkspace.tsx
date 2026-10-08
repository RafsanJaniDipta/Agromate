"use client";

import { useEffect, useRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import CropCyclePicker from "@/components/dashboard/diagnose/CropCyclePicker";
import DiagnosisResult from "@/components/dashboard/diagnose/DiagnosisResult";
import PhotoPicker from "@/components/dashboard/diagnose/PhotoPicker";
import { useDiagnosis } from "@/components/dashboard/diagnose/useDiagnosis";

// The three steps, shown where the answer will appear until there is one
const STEPS = ["photo", "check", "act"] as const;

type DiagnoseWorkspaceProps = {
  // Runs after a check is saved to the history
  onSaved?: () => void;
};

// One card: the photo and its controls on the left, Gemini's answer on the right
// (stacked on phones, answer below).
export default function DiagnoseWorkspace({ onSaved }: DiagnoseWorkspaceProps) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const diagnosis = useDiagnosis(onSaved);
  const { status } = diagnosis;
  const resultRef = useRef<HTMLDivElement>(null);

  // On phones the answer sits below the photo, so bring it into view once it arrives
  useEffect(() => {
    if (status === "done" || status === "error") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  return (
    <DashCard className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
      <div className="flex flex-col gap-4">
        <PhotoPicker diagnosis={diagnosis} />
        <CropCyclePicker diagnosis={diagnosis} />
      </div>

      <div ref={resultRef} className="flex min-w-0 scroll-mt-28 flex-col md:border-l md:border-white/10 md:pl-6">
        {status === "idle" && (
          <ol className="my-auto flex flex-col gap-5">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/20 text-xs text-white/70">
                  {format.number(index + 1)}
                </span>
                <div>
                  <p className="text-sm font-medium">{t(`diagnosePage.steps.${step}.title`)}</p>
                  <p className="mt-0.5 text-sm text-white/55">{t(`diagnosePage.steps.${step}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {status === "loading" && (
          <div aria-live="polite" className="my-auto flex items-center gap-3 text-sm text-white/70">
            <span className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            {t("diagnose.analyzing")}
          </div>
        )}

        <DiagnosisResult diagnosis={diagnosis} />
      </div>
    </DashCard>
  );
}
