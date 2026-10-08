import { api } from "@/lib/api";
import { isMonthInRange } from "@/lib/months";

// A crop in the shared catalog. Name and description are kept in both languages.
export type Crop = {
  id: string;
  name: string;
  nameBn: string | null;
  category: string | null;
  // Months it can be planted, 1 = January … 12 = December. May wrap past December (11 → 1).
  sowingStartMonth: number | null;
  sowingEndMonth: number | null;
  idealSoil: string | null;
  // °C
  optimalTemp: number | null;
  // mm
  optimalRainfall: number | null;
  durationDays: number | null;
  description: string | null;
  descriptionBn: string | null;
};

// What the admin form sends; `null` clears an optional field
export type CropInput = Omit<Crop, "id">;

// `from`–`to` (months 1–12) keeps only crops that can be planted in that period
export type CropFilter = { search?: string; from?: number; to?: number };

// Shows the Bangla text on the Bangla site, falling back to English when it's missing
export function cropName(crop: Pick<Crop, "name" | "nameBn">, locale: string) {
  return locale === "bn" ? (crop.nameBn ?? crop.name) : crop.name;
}

export function cropDescription(crop: Crop, locale: string) {
  return locale === "bn" ? (crop.descriptionBn ?? crop.description) : crop.description;
}

// Whether a crop is usually planted in `month` (1–12); "unknown" when its planting time isn't set
export type PlantingFit = "inSeason" | "otherSeason" | "unknown";

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
