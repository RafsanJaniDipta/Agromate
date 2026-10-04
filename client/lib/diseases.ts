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
