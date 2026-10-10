import { api } from "@/lib/api";
import type { Crop } from "@/lib/crops";
import type { Field } from "@/lib/farms";

// Where a planted crop is in its life, in order
export const CROP_CYCLE_STATUSES = ["PLANNED", "PLANTED", "GROWING", "HARVESTED", "FAILED"] as const;
export type CropCycleStatus = (typeof CROP_CYCLE_STATUSES)[number];

// Statuses of a crop that is still on the field
export const ACTIVE_STATUSES: readonly CropCycleStatus[] = ["PLANNED", "PLANTED", "GROWING"];

// One crop planted on one field, from planting to harvest. Dates are ISO strings.
export type CropCycle = {
  id: string;
  fieldId: string;
  cropId: string;
  plantingDate: string;
  expectedHarvestDate: string | null;
  actualHarvestDate: string | null;
  status: CropCycleStatus;
  notes: string | null;
  crop: Crop;
  field: Field;
};

// Dates are "YYYY-MM-DD" from a date input
export type NewCropCycleInput = {
  fieldId: string;
  cropId: string;
  plantingDate: string;
  // Left out, the server works it out from the crop's growing days
  expectedHarvestDate?: string;
  status: CropCycleStatus;
  notes?: string;
};

// `null` clears a date or the notes
export type CropCycleChanges = {
  status: CropCycleStatus;
  plantingDate: string;
  expectedHarvestDate: string | null;
  actualHarvestDate: string | null;
  notes: string | null;
};

type Envelope<T> = { data: T };

// All of the signed-in farmer's crops, newest planting first
export async function getCropCycles() {
  const { data } = await api<Envelope<CropCycle[]>>("/api/crop-cycles");
  return data;
}

export async function createCropCycle(input: NewCropCycleInput) {
  const { data } = await api<Envelope<CropCycle>>("/api/crop-cycles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

export async function updateCropCycle(id: string, changes: CropCycleChanges) {
  const { data } = await api<Envelope<CropCycle>>(`/api/crop-cycles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
  return data;
}

// Also deletes the costs and harvests recorded for it
export async function deleteCropCycle(id: string) {
  await api(`/api/crop-cycles/${id}`, { method: "DELETE" });
}

// A Date as "YYYY-MM-DD" in the farmer's own time zone, for date inputs
function localDateInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

// ISO date from the API → "YYYY-MM-DD"; local, so a harvest saved at 00:30 in Dhaka keeps its day
export const toDateInput = (iso: string | null) => (iso ? localDateInput(new Date(iso)) : "");

export const todayDateInput = () => localDateInput(new Date());
