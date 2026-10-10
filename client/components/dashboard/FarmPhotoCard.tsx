"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImageIcon, MapPinIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { getFarms, removeFarmPhoto, uploadFarmPhoto, type Farm } from "@/lib/farms";
import { shrinkImage } from "@/lib/shrinkImage";

// Long side of the uploaded photo: sharp on a wide, high-density screen (about 1150 × 2 pixels)
// while staying well under the server's 5 MB limit
const PHOTO_MAX_SIDE = 2560;
const PHOTO_QUALITY = 0.92;

// Cloudinary sizes and compresses the photo for each screen, once, with its best quality setting.
// next/image's own optimiser is skipped (unoptimized) so the photo isn't compressed a second time.
const displayUrl = (url: string) => url.replace("/upload/", "/upload/c_limit,w_2560,q_auto:best,f_auto/");
// A tiny copy for the blurred fill behind the photo; it loads almost instantly
const fillUrl = (url: string) => url.replace("/upload/", "/upload/c_limit,w_64,q_auto,f_auto/");

// The card takes the photo's own shape (width ÷ height) so the whole photo fills it, within limits:
// no taller than 4:3, so a portrait photo doesn't push the dashboard down, and no flatter than 3:1.
// Inside those limits nothing is cropped and nothing is left empty; outside them the blurred fill
// covers the spare space.
const TALLEST_RATIO = 4 / 3;
const FLATTEST_RATIO = 3;
const cardRatio = (photoRatio: number) => Math.min(FLATTEST_RATIO, Math.max(TALLEST_RATIO, photoRatio));

type PhotoStatus = "idle" | "uploading" | "notImage" | "error";

const overlayButton =
  "rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs backdrop-blur-md transition hover:bg-black/75 disabled:opacity-60";

// Dashboard banner: a photo of the farmer's whole place, uploaded by them.
// With several places, pills switch between them; each place keeps its own photo.
export default function FarmPhotoCard() {
  const t = useTranslations("dashboard.farmPhoto");
  const fileInput = useRef<HTMLInputElement>(null);
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<PhotoStatus>("idle");
  // Each photo's width ÷ height, learnt when it loads; keyed by URL so switching places can't mix them up
  const [ratios, setRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    getFarms()
      .then((loaded) => {
        setFarms(loaded);
        // Open on a place that already has a photo, if any
        setSelectedId((loaded.find((farm) => farm.imageUrl) ?? loaded[0])?.id ?? null);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  const farm = farms?.find(({ id }) => id === selectedId) ?? null;

  const replaceFarm = (saved: Farm) =>
    setFarms((current) => current?.map((each) => (each.id === saved.id ? saved : each)) ?? null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so picking the same file again still triggers a change
    if (!file || !farm) return;
    if (!file.type.startsWith("image/")) return setStatus("notImage");

    setStatus("uploading");
    try {
      replaceFarm(await uploadFarmPhoto(farm.id, await shrinkImage(file, PHOTO_MAX_SIDE, PHOTO_QUALITY)));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function handleRemove() {
    if (!farm || !window.confirm(t("confirmRemove"))) return;
    setStatus("uploading");
    try {
      replaceFarm(await removeFarmPhoto(farm.id));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const isBusy = status === "uploading";
  const photoRatio = farm?.imageUrl ? ratios[farm.imageUrl] : undefined;

  return (
    <section
      aria-label={t("title")}
      // The frosted look is only for the empty state; a photo is shown as it is
      className={`relative isolate min-h-64 overflow-hidden rounded-3xl border border-white/10 lg:min-h-72 ${
        farm?.imageUrl ? "bg-black" : "bg-black/40 backdrop-blur-xl"
      }`}
      style={photoRatio ? { aspectRatio: cardRatio(photoRatio) } : undefined}
    >
      <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="sr-only" tabIndex={-1} />

      {farm?.imageUrl && (
        <>
          {/* Blurred copy behind the photo, so any spare space shows the photo's colours instead of black */}
          <Image
            src={fillUrl(farm.imageUrl)}
            alt=""
            aria-hidden
            fill
            unoptimized
            className="-z-20 scale-110 object-cover opacity-70 blur-2xl"
          />
          <Image
            src={displayUrl(farm.imageUrl)}
            alt={t("photoOf", { name: farm.name })}
            fill
            unoptimized
            // contain: the whole photo is shown, never cropped
            className="-z-10 object-contain"
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              const url = farm.imageUrl!;
              if (naturalHeight > 0) setRatios((current) => ({ ...current, [url]: naturalWidth / naturalHeight }));
            }}
          />
        </>
      )}

      {/* States without a photo: still loading, no places yet, or a place waiting for its photo */}
      {!farm?.imageUrl && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          {loadFailed ? (
            <p className="text-sm text-red-300">{t("loadError")}</p>
          ) : !farms ? (
            <p className="text-sm text-white/60">{t("loading")}</p>
          ) : farms.length === 0 ? (
            <div className="flex max-w-xs flex-col items-center gap-3">
              <p className="text-sm text-white/80">{t("noPlaces")}</p>
              <Link
                href="/dashboard/fields"
                className="rounded-full bg-brand px-4 py-2 text-sm font-medium transition hover:opacity-90"
              >
                {t("addPlace")}
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={isBusy}
              className="flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-white/25 px-6 py-10 transition hover:border-white/50 hover:bg-white/5"
            >
              <ImageIcon className="size-10 text-white/70" />
              <span className="font-medium">{isBusy ? t("uploading") : t("uploadPrompt")}</span>
              <span className="text-xs text-white/60">{t("uploadHint")}</span>
            </button>
          )}
        </div>
      )}

      {/* Top: switch between places (only with more than one) */}
      {farms && farms.length > 1 && (
        <div role="group" aria-label={t("placesLabel")} className="absolute left-4 top-4 flex flex-wrap gap-2">
          {farms.map((each) => (
            <button
              key={each.id}
              type="button"
              onClick={() => {
                setSelectedId(each.id);
                setStatus("idle");
              }}
              aria-pressed={each.id === selectedId}
              className={`rounded-full px-3 py-1.5 text-xs backdrop-blur-md transition ${
                each.id === selectedId ? "bg-white text-zinc-900" : "border border-white/20 bg-black/55 hover:bg-black/75"
              }`}
            >
              {each.name}
            </button>
          ))}
        </div>
      )}

      {/* Bottom: which place this is, and photo actions once there is a photo */}
      {farm && (
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs backdrop-blur-md">
            <MapPinIcon className="size-3.5" />
            {farm.name}, {farm.location}
          </p>
          {farm.imageUrl && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={isBusy}
                className={overlayButton}
              >
                {isBusy ? t("uploading") : t("change")}
              </button>
              <button type="button" onClick={handleRemove} disabled={isBusy} className={overlayButton}>
                {t("remove")}
              </button>
            </div>
          )}
        </div>
      )}

      {(status === "notImage" || status === "error") && (
        <p
          role="status"
          className="absolute inset-x-4 top-16 rounded-2xl border border-red-300/30 bg-red-950/80 px-3 py-2 text-xs text-red-100"
        >
          {t(status === "notImage" ? "notImage" : "uploadError")}
        </p>
      )}
    </section>
  );
}
