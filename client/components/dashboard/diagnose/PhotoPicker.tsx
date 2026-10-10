"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CameraIcon, UploadIcon } from "@/components/icons";
import { primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import type { DiagnosisState } from "@/components/dashboard/diagnose/useDiagnosis";

type PhotoPickerProps = {
  diagnosis: DiagnosisState;
};

// The photo frame. Empty, it shows a clear "upload a photo" button (plus "take a photo" on touch
// screens) and accepts a photo dragged onto it; with a photo, the "check" / "another photo" buttons.
export default function PhotoPicker({ diagnosis }: PhotoPickerProps) {
  const t = useTranslations("dashboard.diagnose");
  const { inputRef, file, previewUrl, status, openPicker, pickFile, chooseFile, analyze } = diagnosis;
  // Separate input that opens the camera straight away; the main one opens the gallery / files
  const cameraInput = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) chooseFile(dropped);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pickFile}
        className="sr-only"
        tabIndex={-1}
        aria-label={t("upload")}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pickFile}
        className="sr-only"
        tabIndex={-1}
        aria-label={t("takePhoto")}
      />

      {previewUrl ? (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-black/40">
          <Image src={previewUrl} alt={t("previewAlt")} fill unoptimized className="object-contain" />
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex aspect-4/3 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-4 text-center transition ${
            isDragging ? "border-emerald-400 bg-emerald-400/10" : "border-white/20"
          }`}
        >
          <span className="grid size-14 place-items-center rounded-full bg-white/10">
            <UploadIcon className="size-7 text-white/80" />
          </span>
          <div>
            <p className="font-medium">{t("addPhoto")}</p>
            {/* The drag hint only makes sense with a mouse */}
            <p className="mt-1 text-xs text-white/50">
              {t("addPhotoHint")}
              <span className="pointer-coarse:hidden"> {t("dropHint")}</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={openPicker} className={`${primaryButton} inline-flex items-center gap-2`}>
              <UploadIcon className="size-4" />
              {t("upload")}
            </button>
            {/* Phones and tablets also get a button that opens the camera directly */}
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              className={`${secondaryButton} hidden items-center gap-2 pointer-coarse:inline-flex`}
            >
              <CameraIcon className="size-4" />
              {t("takePhoto")}
            </button>
          </div>
        </div>
      )}

      {file && (
        <div className="flex gap-2">
          <button type="button" onClick={analyze} disabled={status === "loading"} className={`${primaryButton} flex-1`}>
            {status === "loading" ? t("analyzing") : t("analyze")}
          </button>
          <button type="button" onClick={openPicker} disabled={status === "loading"} className={secondaryButton}>
            {t("retake")}
          </button>
        </div>
      )}
    </>
  );
}
