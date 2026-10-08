"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type PhotoFocusPickerProps = {
  imageUrl: string;
  // "x% y%", the same format as CSS object-position
  focus: string;
  onChange: (focus: string) => void;
};

// Whole photo with a marker on the chosen focus point, plus small previews of how
// the home page crops it. Clicking the photo moves the focus there.
export default function PhotoFocusPicker({ imageUrl, focus, onChange }: PhotoFocusPickerProps) {
  const t = useTranslations("admin.stories.photo");
  const [left, top] = focus.split(" ");

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - box.left) / box.width) * 100);
    const y = Math.round(((event.clientY - box.top) / box.height) * 100);
    onChange(`${x}% ${y}%`);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-white/80">{t("title")}</p>

      <button
        type="button"
        onClick={handleClick}
        className="relative block w-full cursor-crosshair overflow-hidden rounded-2xl border border-white/10"
      >
        {/* Natural aspect ratio, so a click position maps straight onto the photo */}
        <Image src={imageUrl} alt={t("alt")} width={0} height={0} sizes="16rem" className="h-auto w-full" />
        <span
          aria-hidden
          style={{ left, top }}
          className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgb(0_0_0/0.5)]"
        />
      </button>
      <p className="text-xs text-white/50">{t("hint")}</p>

      <div className="flex items-center gap-3">
        <span className="text-xs text-white/50">{t("preview")}</span>
        <Image
          src={imageUrl}
          alt=""
          width={48}
          height={48}
          style={{ objectPosition: focus }}
          className="size-12 rounded-full object-cover"
        />
        <span className="relative aspect-video w-24 overflow-hidden rounded-lg">
          <Image src={imageUrl} alt="" fill sizes="6rem" style={{ objectPosition: focus }} className="object-cover" />
        </span>
      </div>
    </div>
  );
}
