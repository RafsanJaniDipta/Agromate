"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { UploadIcon } from "@/components/icons";

type StoryPhotoFieldProps = {
  // Newly picked photo, not uploaded yet
  file: File | null;
  // Photo already saved with the story (when editing)
  savedUrl: string | null;
  onPick: (file: File) => void;
};

// Square photo tile: tap to choose the story photo, tap again (or "change") to replace it.
export default function StoryPhotoField({ file, savedUrl, onPick }: StoryPhotoFieldProps) {
  const t = useTranslations("dashboard.storiesPage.photo");
  const fileInput = useRef<HTMLInputElement>(null);

  const pickedUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  // Free the preview's memory when the photo changes or the form closes
  useEffect(() => () => void (pickedUrl && URL.revokeObjectURL(pickedUrl)), [pickedUrl]);

  const previewUrl = pickedUrl ?? savedUrl;
  const openPicker = () => fileInput.current?.click();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again after an error
    if (picked) onPick(picked);
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 sm:w-36">
      <button
        type="button"
        onClick={openPicker}
        aria-label={previewUrl ? t("change") : t("choose")}
        className="relative grid aspect-square w-36 place-items-center overflow-hidden rounded-2xl border border-dashed border-white/20 text-white/60 transition hover:border-white/40 hover:bg-white/5 hover:text-white"
      >
        {previewUrl ? (
          // Blob previews can't go through the image optimizer
          <Image src={previewUrl} alt={t("alt")} fill unoptimized={Boolean(pickedUrl)} sizes="9rem" className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-2 text-center">
            <UploadIcon className="size-6" />
            <span className="text-xs">{t("choose")}</span>
          </span>
        )}
      </button>

      <input ref={fileInput} type="file" accept="image/*" onChange={handleChange} className="sr-only" tabIndex={-1} />

      {previewUrl ? (
        <button type="button" onClick={openPicker} className="text-xs text-white/60 underline hover:text-white">
          {t("change")}
        </button>
      ) : (
        <p className="text-center text-[11px] leading-snug text-white/45">{t("hint")}</p>
      )}
    </div>
  );
}
