import type { FieldBoundary } from "@/lib/geo";

export const SOIL_TYPES = ["CLAY", "CLAY_LOAM", "LOAM", "SANDY_LOAM", "SANDY", "SILT"] as const;
export type SoilType = (typeof SOIL_TYPES)[number];

export const isSoilType = (value: string): value is SoilType =>
  (SOIL_TYPES as readonly string[]).includes(value);

export type Field = {
  id: string;
  farmId: string;
  name: string;
  areaInAcres: number | null;
  soilType: string | null;
  boundary: FieldBoundary | null;
};

export type Farm = {
  id: string;
  name: string;
  location: string;
  areaInAcres: number | null;
  soilType: string | null;
  imageUrl: string | null;
  fields: Field[];
};

export type FarmInput = {
  name: string;
  location: string;
  areaInAcres?: number;
  soilType: string | null;
};

export type FieldInput = {
  name: string;
  areaInAcres?: number;
  soilType: string | null;
};
