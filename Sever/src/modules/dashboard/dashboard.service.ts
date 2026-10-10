import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

// Crop cycles still in the ground (not harvested or failed)
const ACTIVE_CYCLE_STATUSES = ["PLANNED", "PLANTED", "GROWING"] as const;

// Harvest revenue is quantity × sale price per unit
const revenueOf = (harvests: { quantity: number; pricePerUnit: number }[]) =>
  harvests.reduce((sum, h) => sum + h.quantity * h.pricePerUnit, 0);

export const getSummary = serviceHandler(async (userId: string) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  const [totalFarms, totalFields, activeCropCycles, expenseAgg, harvests] = await Promise.all([
    prisma.farm.count({ where: { userId } }),
    prisma.field.count({ where: { farmId: { in: farmIds } } }),
    prisma.cropCycle.count({
      where: {
        field: { farmId: { in: farmIds } },
        status: { in: [...ACTIVE_CYCLE_STATUSES] },
      },
    }),
    prisma.expense.aggregate({
      where: { farmId: { in: farmIds } },
      _sum: { amount: true },
    }),
    prisma.harvest.findMany({
      where: { cropCycle: { field: { farmId: { in: farmIds } } } },
      select: { quantity: true, pricePerUnit: true },
    }),
  ]);

  return {
    totalFarms,
    totalFields,
    activeCropCycles,
    totalExpenses: expenseAgg._sum.amount || 0,
    totalHarvestQuantity: harvests.reduce((sum, h) => sum + h.quantity, 0),
    totalRevenue: revenueOf(harvests),
  };
});

export const getCropDistribution = serviceHandler(async (userId: string) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  const activeCycles = await prisma.cropCycle.findMany({
    where: {
      field: { farmId: { in: farmIds } },
      status: { in: [...ACTIVE_CYCLE_STATUSES] },
    },
    include: {
      crop: true,
      field: true,
    },
  });

  // One row per crop: how many fields grow it and their total area (acres)
  const map = new Map<string, { cropName: string; cropNameBn: string | null; count: number; area: number }>();

  for (const cycle of activeCycles) {
    const fieldArea = cycle.field.areaInAcres ?? 0;

    const existing = map.get(cycle.crop.id) ?? {
      cropName: cycle.crop.name,
      cropNameBn: cycle.crop.nameBn,
      count: 0,
      area: 0,
    };
    existing.count += 1;
    existing.area += fieldArea;
    map.set(cycle.crop.id, existing);
  }

  return Array.from(map.values());
});

// Bangladesh is UTC+6; months are counted in local time so a 1 AM expense lands on the right day
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
const bdDate = (date: Date) => new Date(date.getTime() + BD_OFFSET_MS);

// Money in and out: all-time totals, plus month by month and by expense type for one year
export const getFinancialSummary = serviceHandler(async (userId: string, year = bdDate(new Date()).getUTCFullYear()) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  const [expenses, harvests] = await Promise.all([
    prisma.expense.findMany({
      where: { farmId: { in: farmIds } },
      select: { date: true, amount: true, category: true },
    }),
    prisma.harvest.findMany({
      where: { cropCycle: { field: { farmId: { in: farmIds } } } },
      select: { harvestDate: true, quantity: true, pricePerUnit: true },
    }),
  ]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenue = revenueOf(harvests);

  // January … December of `year`
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, expenses: 0, income: 0 }));
  const expensesByCategory = new Map<string, number>();

  for (const expense of expenses) {
    const date = bdDate(expense.date);
    if (date.getUTCFullYear() !== year) continue;
    months[date.getUTCMonth()]!.expenses += expense.amount; // month index is always 0–11
    expensesByCategory.set(expense.category, (expensesByCategory.get(expense.category) ?? 0) + expense.amount);
  }
  for (const harvest of harvests) {
    const date = bdDate(harvest.harvestDate);
    if (date.getUTCFullYear() !== year) continue;
    months[date.getUTCMonth()]!.income += harvest.quantity * harvest.pricePerUnit;
  }

  const yearExpenses = months.reduce((sum, month) => sum + month.expenses, 0);
  const yearIncome = months.reduce((sum, month) => sum + month.income, 0);

  return {
    totalExpenses,
    totalRevenue,
    netProfit: totalRevenue - totalExpenses,
    year,
    yearTotals: { expenses: yearExpenses, income: yearIncome, profit: yearIncome - yearExpenses },
    months,
    expensesByCategory: Array.from(expensesByCategory, ([category, amount]) => ({ category, amount })).sort(
      (a, b) => b.amount - a.amount,
    ),
  };
});

export const DashboardService = {
  getSummary,
  getCropDistribution,
  getFinancialSummary,
};
