"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFormatter, useTranslations } from "next-intl";
import type { GeoJSONSource, Marker } from "maplibre-gl";
import { CloseIcon, LocateIcon } from "@/components/icons";
import { hasSatelliteKey, useSatelliteMap } from "@/components/map/useSatelliteMap";
import { primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { saveFieldBoundary, type Field } from "@/lib/farms";
import {
  BANGLADESH_VIEW,
  areaInAcres,
  boundaryFrom,
  boundsOf,
  cornersOf,
  locatePlace,
  type LngLat,
} from "@/lib/geo";

// A field needs at least three corners to have an area
const MIN_CORNERS = 3;
// How close the map zooms when opening on a district or the farmer's GPS position
const DISTRICT_ZOOM = 14;
const GPS_ZOOM = 17;
const FIT_OPTIONS = { padding: 60, maxZoom: 18, duration: 0 };
const smallButton = `${secondaryButton} px-3 py-2 text-xs`;

// What's drawn so far: the shape (from three corners), its edges, and a dot on each corner
function draftShapes(corners: LngLat[]): GeoJSON.FeatureCollection {
  const ring = corners.length >= MIN_CORNERS ? [...corners, corners[0]!] : corners;
  return {
    type: "FeatureCollection",
    features: [
      ...(corners.length >= MIN_CORNERS
        ? [{ type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [ring] } }]
        : []),
      ...(corners.length >= 2
        ? [{ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: ring } }]
        : []),
      ...corners.map((corner) => ({
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: corner },
      })),
    ],
  };
}

type FieldBoundaryEditorProps = {
  field: Field;
  // The place's address, to open the map there when nothing is drawn nearby yet
  placeLocation: string;
  // The farmer's other fields with outlines, shown faintly so the new one can sit next to them
  neighbours: Field[];
  onSaved: (field: Field) => void;
  onClose: () => void;
};

// Full-screen satellite map where the farmer taps each corner of a field to outline it.
export default function FieldBoundaryEditor({
  field,
  placeLocation,
  neighbours,
  onSaved,
  onClose,
}: FieldBoundaryEditorProps) {
  const t = useTranslations("dashboard.farmsPage.boundary");
  const format = useFormatter();
  const mapElement = useRef<HTMLDivElement>(null);
  const ready = useSatelliteMap(mapElement, BANGLADESH_VIEW);
  const [corners, setCorners] = useState<LngLat[]>(() => (field.boundary ? cornersOf(field.boundary) : []));
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "noGps">("idle");
  const gpsMarker = useRef<Marker | null>(null);

  // Escape closes the editor
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  // Once the map is up: draw layers, listen for taps, and open where the field probably is
  useEffect(() => {
    if (!ready) return;
    const { map } = ready;

    map.addSource("neighbours", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: neighbours.flatMap((neighbour) =>
          neighbour.boundary ? [{ type: "Feature" as const, properties: {}, geometry: neighbour.boundary }] : [],
        ),
      },
    });
    map.addLayer({
      id: "neighbours-line",
      type: "line",
      source: "neighbours",
      paint: { "line-color": "#facc15", "line-width": 2, "line-dasharray": [2, 2] },
    });

    map.addSource("draft", { type: "geojson", data: draftShapes([]) });
    map.addLayer({
      id: "draft-fill",
      type: "fill",
      source: "draft",
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": "#22c55e", "fill-opacity": 0.3 },
    });
    map.addLayer({
      id: "draft-line",
      type: "line",
      source: "draft",
      filter: ["==", "$type", "LineString"],
      paint: { "line-color": "#ffffff", "line-width": 2.5 },
    });
    map.addLayer({
      id: "draft-corners",
      type: "circle",
      source: "draft",
      filter: ["==", "$type", "Point"],
      paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-color": "#16a34a", "circle-stroke-width": 2 },
    });

    map.getCanvas().style.cursor = "crosshair";
    map.on("click", (event) => setCorners((current) => [...current, [event.lngLat.lng, event.lngLat.lat]]));

    // Open on the field itself, else on the farmer's other fields, else on the place's district
    const startCorners = field.boundary ? cornersOf(field.boundary) : [];
    const neighbourCorners = neighbours.flatMap((neighbour) => (neighbour.boundary ? cornersOf(neighbour.boundary) : []));
    if (startCorners.length > 0) {
      map.fitBounds(boundsOf(startCorners), FIT_OPTIONS);
    } else if (neighbourCorners.length > 0) {
      map.fitBounds(boundsOf(neighbourCorners), FIT_OPTIONS);
    } else {
      locatePlace(placeLocation)
        .then(({ latitude, longitude, found }) => {
          if (found) map.jumpTo({ center: [longitude, latitude], zoom: DISTRICT_ZOOM });
        })
        .catch(() => {});
    }
    // Runs once per map; the field and neighbours don't change while the editor is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Redraw the outline whenever a corner is added or removed
  useEffect(() => {
    const source = ready?.map.getSource("draft") as GeoJSONSource | undefined;
    source?.setData(draftShapes(corners));
  }, [ready, corners]);

  // Jumps to where the phone is, for drawing while standing in the field
  function goToMyPosition() {
    if (!ready || !navigator.geolocation) return setStatus("noGps");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: LngLat = [coords.longitude, coords.latitude];
        ready.map.flyTo({ center: position, zoom: GPS_ZOOM });
        gpsMarker.current?.remove();
        gpsMarker.current = new ready.maplibre.Marker({ color: "#38bdf8" }).setLngLat(position).addTo(ready.map);
        setStatus("idle");
      },
      () => setStatus("noGps"),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  async function save(remove = false) {
    if (remove && !window.confirm(t("confirmRemove"))) return;
    setStatus("saving");
    try {
      const boundary = remove ? null : boundaryFrom(corners);
      // A field with no area yet takes the drawn one
      const fillArea = !remove && !field.areaInAcres ? Math.round(areaInAcres(corners) * 100) / 100 : undefined;
      onSaved(await saveFieldBoundary(field.id, boundary, fillArea));
    } catch {
      setStatus("error");
    }
  }

  const acres = areaInAcres(corners);
  const canSave = corners.length >= MIN_CORNERS && status !== "saving";

  // Rendered in <body>: the cards around it use backdrop blur, which would trap a fixed overlay inside them
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("title", { name: field.name })} className="fixed inset-0 z-50 bg-black">
      {hasSatelliteKey ? (
        // MapLibre sets position: relative on its own element, so the positioning lives on a wrapper
        <div className="absolute inset-0">
          <div ref={mapElement} className="size-full" />
        </div>
      ) : (
        <p className="grid h-full place-items-center p-6 text-center text-sm text-white/70">{t("noKey")}</p>
      )}

      {/* Top: what to do, and close */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto max-w-md rounded-2xl border border-white/15 bg-black/70 px-4 py-3 text-white backdrop-blur-md">
          <h2 className="font-medium">{t("title", { name: field.name })}</h2>
          <p className="mt-1 text-sm text-white/75">{t("howTo")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition hover:bg-black/90"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      {/* Bottom: area so far and the drawing actions */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border border-white/15 bg-zinc-950/90 p-4 text-white backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {corners.length < MIN_CORNERS
                ? t("cornersSoFar", { count: corners.length })
                : t("area", {
                    acres: format.number(acres, { maximumFractionDigits: 2 }),
                    decimals: format.number(acres * 100, { maximumFractionDigits: 0 }),
                  })}
            </span>
            {!field.areaInAcres && corners.length >= MIN_CORNERS && (
              <span className="text-xs text-white/60">{t("areaWillBeSaved")}</span>
            )}
          </div>

          {status === "error" && <p className="text-sm text-red-300">{t("saveError")}</p>}
          {status === "noGps" && <p className="text-sm text-amber-200">{t("noGps")}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={goToMyPosition} className={`${smallButton} inline-flex items-center gap-1.5`}>
              <LocateIcon className="size-4" />
              {t("myPosition")}
            </button>
            <button
              type="button"
              onClick={() => setCorners((current) => current.slice(0, -1))}
              disabled={corners.length === 0}
              className={smallButton}
            >
              {t("undo")}
            </button>
            <button type="button" onClick={() => setCorners([])} disabled={corners.length === 0} className={smallButton}>
              {t("startOver")}
            </button>
            {field.boundary && (
              <button type="button" onClick={() => save(true)} className={`${smallButton} text-red-300`}>
                {t("remove")}
              </button>
            )}
            <button type="button" onClick={() => save()} disabled={!canSave} className={`${primaryButton} ml-auto`}>
              {status === "saving" ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
