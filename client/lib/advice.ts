import { api } from "@/lib/api";
import type { SoilType } from "@/lib/farms";

// Crop and fertilizer advice for the farmer's land.

type Envelope<T> = { data: T };

export type Range = { min: number; max: number };

// ---- Crop advice ----

export type Timing = "NOW" | "SOON" | "LATER";
export type Fit = "GOOD" | "FAIR" | "POOR" | "UNKNOWN";

export type CropAdvice = {
  crop: { id: string; name: string; nameBn: string | null; durationDays: number | null };
  sowing: { startMonth: number | null; endMonth: number | null };
  timing: Timing;
  soilFit: Fit;
  idealSoils: SoilType[];
  tempFit: Fit;
  optimalTempC: number | null;
  harvestBy: string | null;
  price: {
    nameBn: string;
    nameEn: string;
    unitBn: string;
    unitEn: string;
    minPrice: number;
    maxPrice: number;
    weekChangePercent: number | null;
  } | null;
  score: number;
};

export type CropAdviceResult = {
  id: string;
  month: number;
  soilType: SoilType | null;
  district: string | null;
  field: { id: string; name: string } | null;
  averageTempC: number | null;
  crops: CropAdvice[];
};

export type CropAdviceInput = { fieldId?: string; soilType?: SoilType; month?: number };

export async function getCropAdvice(input: CropAdviceInput) {
  const { data } = await api<Envelope<CropAdviceResult>>("/api/crop-recommendations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

// ---- Fertilizer advice ----

export const FERTILITY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type Fertility = (typeof FERTILITY_LEVELS)[number];

export type FertilizerName = "urea" | "tsp" | "mop" | "gypsum" | "zinc" | "boric";

export type FertilizerLine = {
  fertilizer: FertilizerName;
  perHa: Range;
  total: Range;
  perBigha: Range;
  bags: Range;
  pricePerKg: number | null;
  cost: Range | null;
};

export type FertilizerAdvice = {
  id: string;
  crop: { id: string; name: string; nameBn: string | null };
  field: { id: string; name: string } | null;
  areaAcres: number;
  fertility: Fertility;
  items: FertilizerLine[];
  organic: { perHa: Range; total: Range } | null;
  totalCost: Range | null;
  timing: { bn: string; en: string };
  source: { name: string; url: string };
};

export type FertilizerAdviceInput = { cropId: string; fieldId?: string; areaAcres?: number; fertility: Fertility };

export async function getFertilizerAdvice(input: FertilizerAdviceInput) {
  const { data } = await api<Envelope<FertilizerAdvice>>("/api/fertilizer-recommendations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}
