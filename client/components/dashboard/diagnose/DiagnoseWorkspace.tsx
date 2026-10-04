"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import DiagnosisResult from "@/components/dashboard/diagnose/DiagnosisResult";
import PhotoPicker from "@/components/dashboard/diagnose/PhotoPicker";
import { useDiagnosis } from "@/components/dashboard/diagnose/useDiagnosis";
import { LeafIcon, SparkIcon } from "@/components/icons";

type DiagnoseWorkspaceProps = {
  // Extra cards shown under the result (photo tips, how it works)
  children?: React.ReactNode;
};

// Full disease-check layout: photo on the left, Gemini's answer on the right.
export default function DiagnoseWorkspace({ children }: DiagnoseWorkspaceProps) {
  const t = useTranslations("dashboard");
  const diagnosis = useDiagnosis();
  const { status } = diagnosis;
  const resultRef = useRef<HTMLDivElement>(null);

  // On phones the result sits below the photo, so bring it into view once it arrives
  useEffect(() => {
    if (status === "done" || status === "error") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <DashCard className="flex flex-col gap-4">
        <CardHeader icon={<LeafIcon />} title={t("diagnose.title")} />
        <p className="text-sm text-white/70">{t("diagnose.hint")}</p>
        <PhotoPicker diagnosis={diagnosis} />
      </DashCard>

      <div className="flex min-w-0 flex-col gap-5">
        <div ref={resultRef} className="scroll-mt-28">
          <DashCard className="flex min-h-48 flex-col gap-4">
            <CardHeader icon={<SparkIcon />} title={t("diagnosePage.resultTitle")} />

            {status === "idle" && (
              <p className="text-sm text-white/60">{t("diagnosePage.resultEmpty")}</p>
            )}

            {status === "loading" && (
              <div aria-live="polite" className="flex items-center gap-3 text-sm text-white/70">
                <span className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                {t("diagnose.analyzing")}
              </div>
            )}

            <DiagnosisResult diagnosis={diagnosis} />
          </DashCard>
        </div>

        {children}
      </div>
    </div>
  );
}
