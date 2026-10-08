import type { Crop } from "@/lib/crops";

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type Diagnosis = {
  isPlant: boolean;
  crop: string;
  healthy: boolean;
  disease: string;
  confidence: ConfidenceLevel;
  symptoms: string;
  advice: string[];
};

export const DIAGNOSE_ERRORS = [
  "badImage",
  "tooLarge",
  "notConfigured",
  "busy",
  "upstream",
  "network",
] as const;
export type DiagnoseError = (typeof DIAGNOSE_ERRORS)[number];

export type SavedDiagnosis = {
  id: string;
  imageUrl: string;
  cropName: string;
  isHealthy: boolean;
  disease: string;
  confidence: ConfidenceLevel;
  symptoms: string;
  advice: string[];
  cropCycle: { id: string; crop: Pick<Crop, "name" | "nameBn">; field: { name: string } } | null;
  createdAt: string;
};
