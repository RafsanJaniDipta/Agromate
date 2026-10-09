import { api } from "@/lib/api";

// Printable farm reports built from the account book.

type Envelope<T> = { data: T };

export type CategoryAmount = { category: string; amount: number };
export type Costs = { total: number; byCategory: CategoryAmount[] };
export type Sales = { revenue: number; quantities: { unit: string; quantity: number }[] };

export type CropReport = {
  id: string;
  crop: { name: string; nameBn: string | null };
  field: { name: string; areaInAcres: number | null };
  farm: { name: string };
  status: string;
  plantingDate: string;
  expectedHarvestDate: string | null;
  actualHarvestDate: string | null;
  costs: Costs;
  sales: Sales;
  profit: number;
  perAcre: { cost: number | null; revenue: number | null; profit: number | null };
  // Only in a single-crop report
  expenses?: { category: string; amount: number; date: string; description: string | null }[];
  harvests?: { harvestDate: string; quantity: number; unit: string; pricePerUnit: number; revenue: number }[];
};

export type YearReport = {
  year: number;
  // Years that have crops, newest first
  years: number[];
  crops: CropReport[];
  // Farm costs not tied to a crop
  otherCosts: Costs;
  totals: { cost: number; revenue: number; profit: number; costsByCategory: CategoryAmount[] };
};

export async function getYearReport(year: number) {
  return (await api<Envelope<YearReport>>(`/api/farm-reports/years/${year}`)).data;
}

export async function getCropReport(cropCycleId: string) {
  return (await api<Envelope<CropReport>>(`/api/farm-reports/crops/${cropCycleId}`)).data;
}
