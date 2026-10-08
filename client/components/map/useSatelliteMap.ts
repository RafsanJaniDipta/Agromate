"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState, type RefObject } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { LngLat } from "@/lib/geo";

// Esri World Imagery through ArcGIS Location Platform (free tier: 2 million tiles a month).
// The key is public by design; it is locked to our site's address in the ArcGIS dashboard.
const ARCGIS_API_KEY = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
const IMAGERY_URL = "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
// Esri's terms ask for this to stay visible on the map (copied from the service's copyrightText)
const IMAGERY_ATTRIBUTION =
  "Source: Esri, Vantor, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community";
// Close-up imagery stops here in Bangladesh; the map can zoom further by enlarging these tiles
const IMAGERY_MAX_ZOOM = 18;
const MAP_MAX_ZOOM = 20;

export const hasSatelliteKey = Boolean(ARCGIS_API_KEY);

// Maps already destroyed by this hook. React runs this hook's cleanup before the caller's own
// effect cleanups, so callers check here instead of touching a removed map (which throws).
const removedMaps = new WeakSet<MapLibreMap>();
export const isMapRemoved = (map: MapLibreMap) => removedMaps.has(map);

function satelliteStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      imagery: {
        type: "raster",
        tiles: [`${IMAGERY_URL}?token=${ARCGIS_API_KEY}`],
        tileSize: 256,
        maxzoom: IMAGERY_MAX_ZOOM,
        attribution: IMAGERY_ATTRIBUTION,
      },
    },
    layers: [{ id: "imagery", type: "raster", source: "imagery" }],
  };
}

type MapLibre = typeof import("maplibre-gl");

// A satellite map in `container`, created once in the browser. MapLibre is loaded only here,
// so pages without a map don't download it. Returns the map (and the library, for markers and
// controls) once its style has loaded; both are null until then or when there is no key.
export function useSatelliteMap(container: RefObject<HTMLDivElement | null>, start: { center: LngLat; zoom: number }) {
  const [ready, setReady] = useState<{ map: MapLibreMap; maplibre: MapLibre } | null>(null);
  // Only the first view matters; later changes are made by the caller through the map itself
  const [initialView] = useState(start);

  useEffect(() => {
    if (!hasSatelliteKey || !container.current) return;
    const element = container.current;
    let map: MapLibreMap | null = null;
    let isCancelled = false;

    import("maplibre-gl").then((maplibre) => {
      if (isCancelled) return;
      map = new maplibre.Map({
        container: element,
        style: satelliteStyle(),
        center: initialView.center,
        zoom: initialView.zoom,
        maxZoom: MAP_MAX_ZOOM,
        // Esri requires the source line to stay visible, so it is never collapsed into an (i) button
        attributionControl: { compact: false },
      });
      const loadedMap = map;
      loadedMap.once("load", () => !isCancelled && setReady({ map: loadedMap, maplibre }));
    });

    return () => {
      isCancelled = true;
      if (map) {
        removedMaps.add(map);
        map.remove();
      }
    };
  }, [container, initialView]);

  return ready;
}
