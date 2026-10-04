"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ExpandIcon,
  LayersIcon,
  LocateIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import type { FieldHealth, FieldMarker } from "@/types/dashboard";

// Status dot colour for each field health level (the name is also read out to screen readers)
const healthDot: Record<FieldHealth, string> = {
  healthy: "bg-green-400",
  attention: "bg-sky-400",
  critical: "bg-red-500",
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

const mapButton =
  "flex size-10 items-center justify-center rounded-xl border border-white/15 bg-black/45 backdrop-blur-md transition hover:bg-black/65 disabled:opacity-40";

type FieldMapCardProps = {
  fields: FieldMarker[];
};

// Aerial photo of the farm with a label on each field, plus zoom and full-screen controls.
export default function FieldMapCard({ fields }: FieldMapCardProps) {
  const t = useTranslations("dashboard.map");
  const cardRef = useRef<HTMLElement>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);

  const changeZoom = (step: number) =>
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + step)));

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else cardRef.current?.requestFullscreen();
  }

  return (
    <section
      ref={cardRef}
      aria-label={t("title")}
      className="relative isolate min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-black lg:min-h-72"
    >
      {/* Photo and labels zoom together, so each label stays on its field */}
      <div
        className="absolute inset-0 -z-10 transition-transform duration-500 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <Image
          src="/images/fields/rice-terraces-aerial.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />

        <ul>
          {fields.map(({ id, name, health, position }) => (
            <li
              key={id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-sm backdrop-blur-md"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span className={`size-2 rounded-full ${healthDot[health]}`} />
              {name}
              <span className="sr-only">: {t(`health.${health}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Top-left: map tools (wired up once map layers and field search exist) */}
      <div className="absolute left-4 top-4 flex gap-2">
        <button type="button" aria-label={t("layers")} className={mapButton}>
          <LayersIcon className="size-5" />
        </button>
        <button type="button" aria-label={t("search")} className={mapButton}>
          <SearchIcon className="size-5" />
        </button>
      </div>

      {/* Right edge: full screen, zoom and reset */}
      <div className="absolute inset-y-4 right-4 flex flex-col justify-between">
        <button type="button" aria-label={t("fullscreen")} onClick={toggleFullscreen} className={mapButton}>
          <ExpandIcon className="size-5" />
        </button>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-label={t("zoomIn")}
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={zoom === MAX_ZOOM}
            className={mapButton}
          >
            <PlusIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label={t("zoomOut")}
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={zoom === MIN_ZOOM}
            className={mapButton}
          >
            <MinusIcon className="size-5" />
          </button>
        </div>

        <button type="button" aria-label={t("resetView")} onClick={() => setZoom(MIN_ZOOM)} className={mapButton}>
          <LocateIcon className="size-5" />
        </button>
      </div>
    </section>
  );
}
