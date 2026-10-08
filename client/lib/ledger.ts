import { api } from "@/lib/api";
import type {
  CropOnField,
  DateRange,
  Expense,
  ExpenseCategory,
  ExpenseTarget,
  Harvest,
  HarvestUnit,
  NewExpense,
  NewHarvest,
} from "@/types";
import { EXPENSE_CATEGORIES, HARVEST_UNITS, isHarvestUnit } from "@/types";

export { EXPENSE_CATEGORIES, HARVEST_UNITS, isHarvestUnit };
export type {
  CropOnField,
  DateRange,
  Expense,
  ExpenseCategory,
  ExpenseTarget,
  Harvest,
  HarvestUnit,
  NewExpense,
  NewHarvest,
};

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
