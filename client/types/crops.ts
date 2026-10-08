export type Crop = {
  id: string;
  name: string;
  nameBn: string | null;
  category: string | null;
  sowingStartMonth: number | null;
  sowingEndMonth: number | null;
  idealSoil: string | null;
  optimalTemp: number | null;
  optimalRainfall: number | null;
  durationDays: number | null;
  description: string | null;
  descriptionBn: string | null;
};

export type CropInput = Omit<Crop, "id">;

export type CropFilter = { search?: string; from?: number; to?: number };

export type PlantingFit = "inSeason" | "otherSeason" | "unknown";