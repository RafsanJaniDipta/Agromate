import { api } from "@/lib/api";
import type {
  ConfidenceLevel,
  DiagnoseError,
  Diagnosis,
  Envelope,
  PaginatedResponse,
  SavedDiagnosis,
} from "@/types";
import { CONFIDENCE_LEVELS, DIAGNOSE_ERRORS } from "@/types";

export { CONFIDENCE_LEVELS, DIAGNOSE_ERRORS };
export type { ConfidenceLevel, DiagnoseError, Diagnosis, SavedDiagnosis };


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
