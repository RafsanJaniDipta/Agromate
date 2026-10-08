import { api } from "@/lib/api";
import type { FieldBoundary } from "@/lib/geo";
import type { Envelope, Farm, FarmInput, Field, FieldInput, SoilType } from "@/types";
import { isSoilType, SOIL_TYPES } from "@/types";

export { isSoilType, SOIL_TYPES };
export type { Farm, FarmInput, Field, FieldInput, SoilType };


// The signed-in farmer's farms, each with its fields
export async function getFarms() {
  const { data } = await api<Envelope<Farm[]>>("/api/farms");
  return data;
}

export async function createFarm(input: FarmInput) {
  const { data } = await api<Envelope<Omit<Farm, "fields">>>("/api/farms", {
    method: "POST",
    body: JSON.stringify(input),
  });
  // A new farm has no fields yet; the create response leaves the list out
  return { ...data, fields: [] } satisfies Farm;
}

export async function updateFarm(id: string, input: FarmInput) {
  const { data } = await api<Envelope<Farm>>(`/api/farms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data;
}

// Uploads a photo of the whole place (replacing any earlier one) and returns the updated farm
export async function uploadFarmPhoto(farmId: string, photo: Blob) {
  const body = new FormData();
  body.append("photo", photo, "farm.jpg");
  const { data } = await api<Envelope<Farm>>(`/api/farms/${farmId}/photo`, { method: "POST", body });
  return data;
}

export async function removeFarmPhoto(farmId: string) {
  const { data } = await api<Envelope<Farm>>(`/api/farms/${farmId}/photo`, { method: "DELETE" });
  return data;
}

// Also deletes the farm's fields and everything recorded on them
export async function deleteFarm(id: string) {
  await api(`/api/farms/${id}`, { method: "DELETE" });
}

export async function createField(farmId: string, input: FieldInput) {
  const { data } = await api<Envelope<Field>>(`/api/farms/${farmId}/fields`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

export async function updateField(id: string, input: FieldInput) {
  const { data } = await api<Envelope<Field>>(`/api/fields/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data;
}

// Saves the outline drawn on the map (null removes it). A field with no area yet gets the
// drawn area too, so the farmer does not have to work it out.
export async function saveFieldBoundary(id: string, boundary: FieldBoundary | null, areaInAcres?: number) {
  const { data } = await api<Envelope<Field>>(`/api/fields/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ boundary, ...(areaInAcres !== undefined ? { areaInAcres } : {}) }),
  });
  return data;
}

// Also deletes the crops, harvests and records on this field
export async function deleteField(id: string) {
  await api(`/api/fields/${id}`, { method: "DELETE" });
}
