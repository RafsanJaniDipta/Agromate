import { api } from "@/lib/api";
import type { Crop } from "@/lib/crops";

// Money in and out: costs (of one crop or a whole place) and what harvests sold for.
// Amounts are in taka; dates are ISO strings from the API, "YYYY-MM-DD" when sent.

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

// Units the farmer sells a harvest in; the server stores them upper-case
export const HARVEST_UNITS = ["KG", "MAUND", "TON"] as const;
export type HarvestUnit = (typeof HARVEST_UNITS)[number];

export const isHarvestUnit = (unit: string): unit is HarvestUnit =>
  (HARVEST_UNITS as readonly string[]).includes(unit);

// Names that come with each entry, so lists can say what it was for
type CropOnField = { crop: Pick<Crop, "name" | "nameBn">; field: { name: string } };

export type Expense = {
  id: string;
  farmId: string;
  // Null for a cost of the whole place (e.g. a pump repair), not one crop
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

// What a new cost belongs to: one planted crop, or a whole place
export type ExpenseTarget = { cropCycleId: string } | { farmId: string };

// A period as "YYYY-MM-DD" dates, both ends included
export type DateRange = { from: string; to: string };

type Envelope<T> = { data: T };
type ListResponse<T> = Envelope<{ items: T[] }>;

// One crop, or one period of the books, rarely has more entries than this; lists aren't paged
const LEDGER_LIMIT = 500;

export const harvestIncome = (harvest: Harvest) => harvest.quantity * harvest.pricePerUnit;

const rangeQuery = ({ from, to }: DateRange) => `from=${from}&to=${to}T23:59:59`;

export async function getCropExpenses(cropCycleId: string) {
  const { data } = await api<ListResponse<Expense>>(
    `/api/expenses?cropCycleId=${cropCycleId}&limit=${LEDGER_LIMIT}`,
  );
  return data.items;
}

export async function getCropHarvests(cropCycleId: string) {
  const { data } = await api<ListResponse<Harvest>>(
    `/api/harvests?cropCycleId=${cropCycleId}&limit=${LEDGER_LIMIT}`,
  );
  return data.items;
}

// Every cost in a period, across all places and crops, newest first
export async function getExpenses(range: DateRange) {
  const { data } = await api<ListResponse<Expense>>(`/api/expenses?${rangeQuery(range)}&limit=${LEDGER_LIMIT}`);
  return data.items;
}

// Every harvest in a period, newest first
export async function getHarvests(range: DateRange) {
  const { data } = await api<ListResponse<Harvest>>(`/api/harvests?${rangeQuery(range)}&limit=${LEDGER_LIMIT}`);
  return data.items;
}

export async function addExpense(target: ExpenseTarget, expense: NewExpense) {
  const { data } = await api<Envelope<Expense>>("/api/expenses", {
    method: "POST",
    body: JSON.stringify({ ...target, ...expense }),
  });
  return data;
}

export async function updateExpense(id: string, expense: NewExpense) {
  const { data } = await api<Envelope<Expense>>(`/api/expenses/${id}`, {
    method: "PATCH",
    // An empty note clears the old one
    body: JSON.stringify({ ...expense, description: expense.description ?? "" }),
  });
  return data;
}

export async function addHarvest(cropCycleId: string, harvest: NewHarvest) {
  const { data } = await api<Envelope<Harvest>>("/api/harvests", {
    method: "POST",
    body: JSON.stringify({ cropCycleId, ...harvest }),
  });
  return data;
}

export async function updateHarvest(id: string, harvest: NewHarvest) {
  const { data } = await api<Envelope<Harvest>>(`/api/harvests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(harvest),
  });
  return data;
}

export async function deleteExpense(id: string) {
  await api(`/api/expenses/${id}`, { method: "DELETE" });
}

export async function deleteHarvest(id: string) {
  await api(`/api/harvests/${id}`, { method: "DELETE" });
}
