import { AppError } from "./AppError.js";

// A field outline as GeoJSON: one closed ring of [longitude, latitude] points
export type FieldBoundary = { type: "Polygon"; coordinates: [number, number][][] };

// A box around Bangladesh with some margin; points outside it are a mistake, not a field
const BOUNDS = { minLon: 87.5, maxLon: 93, minLat: 20, maxLat: 27 };
// A triangle is the smallest shape, plus the first point repeated to close the ring
const MIN_RING_POINTS = 4;
// Far more than anyone taps by hand; keeps a bad request from storing a huge shape
const MAX_RING_POINTS = 200;

const isPoint = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((n) => typeof n === "number" && Number.isFinite(n)) &&
  value[0] >= BOUNDS.minLon &&
  value[0] <= BOUNDS.maxLon &&
  value[1] >= BOUNDS.minLat &&
  value[1] <= BOUNDS.maxLat;

// Checks a boundary sent by the client. `null` clears it; `undefined` means "not sent".
// Anything else must be a closed polygon inside Bangladesh, or the request is rejected with a 422.
export function parseFieldBoundary(value: unknown): FieldBoundary | null | undefined {
  if (value === undefined || value === null) return value;

  const polygon = value as Partial<FieldBoundary>;
  const ring = Array.isArray(polygon.coordinates) ? polygon.coordinates[0] : undefined;
  const first = ring?.[0];
  const last = ring?.[ring.length - 1];

  const isValid =
    polygon.type === "Polygon" &&
    polygon.coordinates?.length === 1 &&
    Array.isArray(ring) &&
    ring.length >= MIN_RING_POINTS &&
    ring.length <= MAX_RING_POINTS &&
    ring.every(isPoint) &&
    first?.[0] === last?.[0] &&
    first?.[1] === last?.[1];

  if (!isValid) {
    throw AppError.unprocessable("boundary must be a closed GeoJSON Polygon inside Bangladesh");
  }
  return { type: "Polygon", coordinates: [ring as [number, number][]] };
}
