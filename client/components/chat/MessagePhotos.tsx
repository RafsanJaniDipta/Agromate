"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@/components/icons";
import { chatPhotoUrl } from "@/lib/chat";

// A bubble shows at most this many tiles; the last one says how many more there are
const TILES_SHOWN = 4;

type MessagePhotosProps = {
  urls: string[];
  // Still uploading: the URLs are local previews, not on Cloudinary yet
  pending?: boolean;
};

// The photos of one message: a lone photo fills the bubble, a group sits in a 2-column grid
// (3 photos: one wide on top). Tapping a photo opens the viewer, which pages through all of them.
export default function MessagePhotos({ urls, pending = false }: MessagePhotosProps) {
  const t = useTranslations("chat.thread");
  const format = useFormatter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const shown = (url: string, size: "single" | "tile") => (pending ? url : chatPhotoUrl(url, size));
  const alt = (index: number) => t("photoAlt", { number: index + 1, total: urls.length });

  if (urls.length === 1) {
    return (
      <>
        <button type="button" onClick={() => setOpenIndex(0)} disabled={pending} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary already sizes it (see chatPhotoUrl) */}
          <img src={shown(urls[0]!, "single")} alt={alt(0)} loading="lazy" className="max-h-80 w-full rounded-xl object-cover" />
        </button>
        {openIndex !== null && <PhotoViewer urls={urls} startAt={openIndex} onClose={() => setOpenIndex(null)} />}
      </>
    );
  }

  const tiles = urls.slice(0, TILES_SHOWN);
  const hidden = urls.length - tiles.length;

  return (
    <>
      <ul className="grid grid-cols-2 gap-1">
        {tiles.map((url, index) => {
          const isWide = urls.length === 3 && index === 0;
          const showsMore = hidden > 0 && index === tiles.length - 1;
          return (
            <li key={url} className={isWide ? "col-span-2" : ""}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                disabled={pending}
                aria-label={showsMore ? t("morePhotos", { count: hidden }) : undefined}
                className={`relative block w-full overflow-hidden rounded-lg ${isWide ? "aspect-2/1" : "aspect-square"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary already sizes it (see chatPhotoUrl) */}
                <img src={shown(url, "tile")} alt={alt(index)} loading="lazy" className="size-full object-cover" />
                {showsMore && (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-semibold text-white">
                    +{format.number(hidden)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {openIndex !== null && <PhotoViewer urls={urls} startAt={openIndex} onClose={() => setOpenIndex(null)} />}
    </>
  );
}

type PhotoViewerProps = { urls: string[]; startAt: number; onClose: () => void };

// Full-screen look at a message's photos. A native <dialog> traps focus and closes on Escape;
// the arrow keys (and buttons) page through, and a click on the dark backdrop closes it.
function PhotoViewer({ urls, startAt, onClose }: PhotoViewerProps) {
  const t = useTranslations("chat.thread");
  const format = useFormatter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(startAt);
  const hasMany = urls.length > 1;
  const url = urls[index]!;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const step = (by: number) => setIndex((current) => (current + by + urls.length) % urls.length);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (!hasMany) return;
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  }

  const navButton = "grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20";

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      aria-label={t("viewer.title")}
      className="m-auto h-svh max-h-none w-screen max-w-none bg-transparent p-0 text-white backdrop:bg-black/90"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 p-3">
          <p aria-live="polite" className="px-2 text-sm text-white/70">
            {hasMany && t("viewer.counter", { number: format.number(index + 1), total: format.number(urls.length) })}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {t("viewer.original")}
            </a>
            <button type="button" onClick={() => dialog.current?.close()} aria-label={t("viewer.close")} className={navButton}>
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>

        {/* Clicks on the empty space around the photo close the viewer, like the backdrop */}
        <div
          className="flex min-h-0 flex-1 items-center justify-center gap-3 px-3 pb-6"
          onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
        >
          {hasMany && (
            <button type="button" onClick={() => step(-1)} aria-label={t("viewer.previous")} className={navButton}>
              <ArrowLeftIcon className="size-5" />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary already sizes it (see chatPhotoUrl) */}
          <img
            key={url}
            src={chatPhotoUrl(url, "full")}
            alt={t("photoAlt", { number: index + 1, total: urls.length })}
            className="max-h-full min-w-0 max-w-full rounded-lg object-contain"
          />
          {hasMany && (
            <button type="button" onClick={() => step(1)} aria-label={t("viewer.next")} className={navButton}>
              <ArrowRightIcon className="size-5" />
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
