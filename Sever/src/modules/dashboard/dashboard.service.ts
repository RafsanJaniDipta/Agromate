import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export const getSummary = serviceHandler(async (userId: string) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  const [activeFarms, totalFields, activeCropCycles, expenseAgg, harvestAgg] = await Promise.all([
    prisma.farm.count({ where: { userId, ...( { status: "ACTIVE" } as any ) } }),
    prisma.field.count({ where: { farmId: { in: farmIds } } }),
    prisma.cropCycle.count({
      where: {
        field: { farmId: { in: farmIds } },
        status: { in: ["PLANTED", "GROWING", "HARVESTING", "PLANNED"] as any },
      },
    }),
    prisma.expense.aggregate({
      where: { farmId: { in: farmIds } },
      _sum: { amount: true },
    }),
    prisma.harvest.aggregate({
      where: { cropCycle: { field: { farmId: { in: farmIds } } } },
      _sum: { quantity: true },
    }),
  ]);

  return {
    activeFarms,
    totalFields,
    activeCropCycles,
    totalExpenses: expenseAgg._sum.amount || 0,
    totalHarvestQuantity: harvestAgg._sum.quantity || 0,
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
    },
    include: {
      crop: true,
      field: true,
    },
  });

  const map = new Map<string, { cropName: string; count: number; area: number }>();

  for (const cycle of activeCycles) {
    const cropName = cycle.crop.name;
    const fieldArea = Number((cycle.field as any).area ?? (cycle.field as any).sizeInHectares ?? 0);

    const existing = map.get(cropName) || { cropName, count: 0, area: 0 };
    existing.count += 1;
    existing.area += fieldArea;
    map.set(cropName, existing);
  }

  return Array.from(map.values());
});

export const getFinancialSummary = serviceHandler(async (userId: string, _period?: string) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  const [expenseAgg, harvests, expenses] = await Promise.all([
    prisma.expense.aggregate({
      where: { farmId: { in: farmIds } },
      _sum: { amount: true },
    }),
    prisma.harvest.findMany({
      where: { cropCycle: { field: { farmId: { in: farmIds } } } },
      select: { totalRevenue: true },
    }),
    prisma.expense.findMany({
      where: { farmId: { in: farmIds } },
      select: { date: true, amount: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalExpenses = expenseAgg._sum.amount || 0;
  const totalRevenue = harvests.reduce((sum, h) => sum + (h.totalRevenue || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const monthlyMap = new Map<string, number>();
  for (const exp of expenses) {
    const monthStr = exp.date ? new Date(exp.date).toISOString().slice(0, 7) : "Unknown";
    monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + exp.amount);
  }

  const monthlyExpenses = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
    month,
    amount,
  }));

  return {
    totalExpenses,
    totalRevenue,
    netProfit,
    monthlyExpenses,
  };
});

export const DashboardService = {
  getSummary,
  getCropDistribution,
  getFinancialSummary,
};
