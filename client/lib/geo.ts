import { api } from "@/lib/api";

// [longitude, latitude], the order GeoJSON and MapLibre use
export type LngLat = [number, number];

// A field outline as stored by the API: one closed ring of points
export type FieldBoundary = { type: "Polygon"; coordinates: LngLat[][] };

// The whole country, for when there's nothing better to show
export const BANGLADESH_VIEW = { center: [90.35, 23.7] as LngLat, zoom: 6.5 };

const SQUARE_METRES_PER_ACRE = 4046.8564224;
const EARTH_RADIUS_M = 6_371_008.8;

// The points the farmer tapped, without the closing repeat of the first one
export const cornersOf = (boundary: FieldBoundary): LngLat[] => (boundary.coordinates[0] ?? []).slice(0, -1);

// Corners → a stored outline (the ring must end where it starts)
export function boundaryFrom(corners: LngLat[]): FieldBoundary {
  return { type: "Polygon", coordinates: [[...corners, corners[0]!]] };
}

// Area inside the corners, in acres. Flattens the earth around the field first, which is
// accurate to well under 1% for anything field-sized.
export function areaInAcres(corners: LngLat[]): number {
  if (corners.length < 3) return 0;
  const midLatitude = (corners.reduce((sum, [, lat]) => sum + lat, 0) / corners.length) * (Math.PI / 180);
  const toMetres = ([lng, lat]: LngLat) => [
    lng * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(midLatitude),
    lat * (Math.PI / 180) * EARTH_RADIUS_M,
  ];

  // Shoelace formula over the flattened points
  const points = corners.map(toMetres);
  const doubleArea = points.reduce((sum, [x1, y1], index) => {
    const [x2, y2] = points[(index + 1) % points.length]!;
    return sum + x1! * y2! - x2! * y1!;
  }, 0);
  return Math.abs(doubleArea) / 2 / SQUARE_METRES_PER_ACRE;
}

// Middle of the corners, for placing a field's name label
export function centreOf(corners: LngLat[]): LngLat {
  const sum = corners.reduce(([lngSum, latSum], [lng, lat]) => [lngSum + lng, latSum + lat], [0, 0]);
  return [sum[0] / corners.length, sum[1] / corners.length];
}

// South-west and north-east corners of a box around all the points
export function boundsOf(points: LngLat[]): [LngLat, LngLat] {
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

// Where a free-text place ("শিবগঞ্জ, বগুড়া") is, using the same lookup as the weather.
// Without a location: the farmer's own place. `found` is false when it fell back to Dhaka.
export async function locatePlace(location?: string) {
  const query = location ? `?location=${encodeURIComponent(location)}` : "";
  const { data } = await api<{ data: { latitude: number; longitude: number; found: boolean } }>(
    `/api/weather/locate${query}`,
  );
  return data;
}
