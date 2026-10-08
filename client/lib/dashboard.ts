import { api } from "@/lib/api";
import type { ExpenseCategory } from "@/lib/ledger";

// The farmer dashboard's numbers. Money is in taka; months are 1 = January … 12 = December.

export type DashboardSummary = {
  totalFarms: number;
  totalFields: number;
  // Crops still on the field (planned, planted or growing)
  activeCropCycles: number;
  totalExpenses: number;
  totalRevenue: number;
};

export type MonthMoney = { month: number; expenses: number; income: number };

export type FinancialSummary = {
  // All-time totals
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  // The year the rest is about
  year: number;
  yearTotals: { expenses: number; income: number; profit: number };
  months: MonthMoney[];
  // Biggest first
  expensesByCategory: { category: ExpenseCategory; amount: number }[];
};

// One crop on the farmer's fields right now
export type CropShare = { cropName: string; cropNameBn: string | null; count: number; area: number };

type Envelope<T> = { data: T };

export async function getDashboardSummary() {
  const { data } = await api<Envelope<DashboardSummary>>("/api/dashboard/summary");
  return data;
}

// Defaults to this year
export async function getFinancialSummary(year?: number) {
  const query = year ? `?year=${year}` : "";
  const { data } = await api<Envelope<FinancialSummary>>(`/api/dashboard/financial-summary${query}`);
  return data;
}

export async function getCropDistribution() {
  const { data } = await api<Envelope<CropShare[]>>("/api/dashboard/crop-distribution");
  return data;
}
