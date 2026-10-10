// Soil types as the app stores them (the farm and field forms use these codes). Older rows and
// the crop list write them in words ("Clay Loam", "Loamy / Sandy Loam"), so text is mapped here.

export const SOIL_TYPES = ["CLAY", "CLAY_LOAM", "LOAM", "SANDY_LOAM", "SANDY", "SILT"] as const;
export type SoilType = (typeof SOIL_TYPES)[number];

// One soil description → its code, or null when it names none
export function soilCode(text?: string | null): SoilType | null {
  if (!text) return null;
  const words = text.toUpperCase().replace(/[^A-Z]+/g, "_");
  if (words.includes("SANDY_LOAM")) return "SANDY_LOAM";
  if (words.includes("CLAY_LOAM")) return "CLAY_LOAM";
  if (words.includes("SILT") || words.includes("ALLUVIAL")) return "SILT";
  if (words.includes("LOAM")) return "LOAM";
  if (words.includes("SAND")) return "SANDY";
  if (words.includes("CLAY")) return "CLAY";
  return null;
}

// Every soil a description lists ("Loamy / Sandy Loam" → LOAM, SANDY_LOAM)
export const soilCodes = (text?: string | null) =>
  [...new Set((text ?? "").split(/[/,]| or /i).map(soilCode).filter((code) => code !== null))];

// Soils close enough that a crop usually still does fine
const NEIGHBOURS: Record<SoilType, SoilType[]> = {
  CLAY: ["CLAY_LOAM"],
  CLAY_LOAM: ["CLAY", "LOAM", "SILT"],
  LOAM: ["CLAY_LOAM", "SANDY_LOAM", "SILT"],
  SANDY_LOAM: ["LOAM", "SANDY"],
  SANDY: ["SANDY_LOAM"],
  SILT: ["LOAM", "CLAY_LOAM"],
};

export type SoilFit = "GOOD" | "FAIR" | "POOR" | "UNKNOWN";

// How well a field's soil suits a crop's ideal soils
export function soilFit(fieldSoil: SoilType | null, idealSoils: SoilType[]): SoilFit {
  if (!fieldSoil || idealSoils.length === 0) return "UNKNOWN";
  if (idealSoils.includes(fieldSoil)) return "GOOD";
  if (idealSoils.some((soil) => NEIGHBOURS[soil].includes(fieldSoil))) return "FAIR";
  return "POOR";
}
