import { api } from "@/lib/api";
import type { Crop } from "@/lib/crops";

// Crop disease check, powered by Google Gemini (image understanding).
// The farmer sends a photo of any part of the plant (leaf, fruit, stem, root, flower,
// grain or the whole plant); /api/diagnose asks Gemini to name the crop and the likely
// problem, and returns a short, structured answer in the farmer's language.

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// What /api/diagnose returns on success
export type Diagnosis = {
  isPlant: boolean; // false: no plant/plant part in the photo (or too unclear to judge)
  crop: string; // crop name as recognised by Gemini, in the farmer's language
  healthy: boolean;
  disease: string; // disease name in the farmer's language; empty when healthy
  confidence: ConfidenceLevel;
  symptoms: string; // what in the photo points to this
  advice: string[]; // a few short, practical next steps
};

// Error codes /api/diagnose can return; each has a message in "dashboard.diagnose.errors"
export const DIAGNOSE_ERRORS = [
  "badImage",
  "tooLarge",
  "notConfigured",
  "busy",
  "upstream",
  "network",
] as const;
export type DiagnoseError = (typeof DIAGNOSE_ERRORS)[number];

// A finished check kept in the farmer's history (saved by the API with its photo)
export type SavedDiagnosis = {
  id: string;
  imageUrl: string;
  cropName: string;
  isHealthy: boolean;
  disease: string; // empty when healthy
  confidence: ConfidenceLevel;
  symptoms: string;
  advice: string[];
  // The farmer's planted crop the photo was from, when they picked one
  cropCycle: { id: string; crop: Pick<Crop, "name" | "nameBn">; field: { name: string } } | null;
  createdAt: string;
};

type Envelope<T> = { data: T };

// Keeps a check in the history. The photo is the same (already shrunk) one Gemini looked at.
export async function saveDiagnosis(photo: Blob, diagnosis: Diagnosis, cropCycleId?: string) {
  const body = new FormData();
  body.append("image", photo, "plant.jpg");
  body.append("cropName", diagnosis.crop);
  body.append("isHealthy", String(diagnosis.healthy));
  body.append("disease", diagnosis.disease);
  body.append("confidence", diagnosis.confidence);
  body.append("symptoms", diagnosis.symptoms);
  body.append("advice", JSON.stringify(diagnosis.advice));
  if (cropCycleId) body.append("cropCycleId", cropCycleId);

  const { data } = await api<Envelope<SavedDiagnosis>>("/api/disease-detections", { method: "POST", body });
  return data;
}

// One page of the history, newest first
export async function getDiagnosisHistory(page: number, limit: number) {
  const { data } = await api<Envelope<{ items: SavedDiagnosis[]; meta: { total: number } }>>(
    `/api/disease-detections?page=${page}&limit=${limit}`,
  );
  return data;
}

// Also removes the saved photo
export async function deleteDiagnosis(id: string) {
  await api(`/api/disease-detections/${id}`, { method: "DELETE" });
}
