import type { Crop } from "./crops";

export const EXPENSE_CATEGORIES = [
  "SEEDS",
  "FERTILIZER",
  "PESTICIDE",
  "LABOR",
  "IRRIGATION",
  "EQUIPMENT",
  "TRANSPORT",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const HARVEST_UNITS = ["KG", "MAUND", "TON"] as const;
export type HarvestUnit = (typeof HARVEST_UNITS)[number];

export const isHarvestUnit = (unit: string): unit is HarvestUnit =>
  (HARVEST_UNITS as readonly string[]).includes(unit);

export type CropOnField = { crop: Pick<Crop, "name" | "nameBn">; field: { name: string } };

export type Expense = {
  id: string;
  farmId: string;
  cropCycleId: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  date: string;
  farm?: { id: string; name: string };
  cropCycle?: CropOnField | null;
};

export type Harvest = {
  id: string;
  cropCycleId: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  cropCycle?: CropOnField;
};

export type NewExpense = { category: ExpenseCategory; amount: number; date: string; description?: string };
export type NewHarvest = { quantity: number; unit: HarvestUnit; pricePerUnit: number; harvestDate: string };

export type ExpenseTarget = { cropCycleId: string } | { farmId: string };

export type DateRange = { from: string; to: string };
