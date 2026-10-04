"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { LeafIcon } from "@/components/icons";
import type { DiagnosisState } from "@/components/dashboard/diagnose/useDiagnosis";

type PhotoPickerProps = {
  diagnosis: DiagnosisState;
};

// Camera/upload area with the photo preview and the "check" / "another photo" buttons.
export default function PhotoPicker({ diagnosis }: PhotoPickerProps) {
  const t = useTranslations("dashboard.diagnose");
  const { inputRef, file, previewUrl, status, openPicker, pickFile, analyze } = diagnosis;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pickFile}
        className="sr-only"
        aria-label={t("choose")}
      />

      {previewUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10">
          <Image src={previewUrl} alt={t("previewAlt")} fill unoptimized className="object-cover" />
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/25 text-white/70 transition hover:border-white/50 hover:text-white"
        >
          <LeafIcon className="size-10" />
          <span className="text-sm font-medium">{t("choose")}</span>
        </button>
      )}

      {file && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={analyze}
            disabled={status === "loading"}
            className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {status === "loading" ? t("analyzing") : t("analyze")}
          </button>
          <button
            type="button"
            onClick={openPicker}
            className="rounded-full border border-white/20 px-4 py-2.5 text-sm transition hover:bg-white/10"
          >
            {t("retake")}
          </button>
        </div>
      )}
    </>
  );
}
