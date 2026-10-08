import { api } from "@/lib/api";
import { isMonthInRange } from "@/lib/months";
import type { Crop, CropFilter, CropInput, PlantingFit } from "@/types";

export type { Crop, CropFilter, CropInput, PlantingFit };


export function plantingFit(crop: Crop, month: number): PlantingFit {
  if (crop.sowingStartMonth === null || crop.sowingEndMonth === null) return "unknown";
  return isMonthInRange(month, crop.sowingStartMonth, crop.sowingEndMonth) ? "inSeason" : "otherSeason";
}

export async function getCrops({ search, from, to }: CropFilter = {}) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (from && to) {
    query.set("from", String(from));
    query.set("to", String(to));
  }

  const queryString = query.size > 0 ? `?${query}` : "";
  const { data } = await api<{ data: Crop[] }>(`/api/crops${queryString}`);
  return data;
}

export async function createCrop(input: CropInput) {
  const { data } = await api<{ data: Crop }>("/api/crops", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

export async function updateCrop(id: string, input: CropInput) {
  const { data } = await api<{ data: Crop }>(`/api/crops/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data;
}

export async function deleteCrop(id: string) {
  await api(`/api/crops/${id}`, { method: "DELETE" });
}
