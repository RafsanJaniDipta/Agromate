import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";

// Printable farm reports from the account book: one crop's season (costs by category, harvests,
// sales, profit, per acre) or a whole year (every crop, plus farm costs not tied to a crop).

type ExpenseRow = { category: string; amount: number; date: Date; description: string | null };
type HarvestRow = { harvestDate: Date; quantity: number; unit: string; pricePerUnit: number };

const round = (value: number) => Math.round(value * 100) / 100;

function sumExpenses(expenses: ExpenseRow[]) {
  const byCategory = new Map<string, number>();
  for (const expense of expenses) byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount);
  return {
    total: round(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
    byCategory: [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount),
  };
}

function sumHarvests(harvests: HarvestRow[]) {
  const byUnit = new Map<string, number>();
  for (const harvest of harvests) byUnit.set(harvest.unit, (byUnit.get(harvest.unit) ?? 0) + harvest.quantity);
  return {
    revenue: round(harvests.reduce((sum, harvest) => sum + harvest.quantity * harvest.pricePerUnit, 0)),
    quantities: [...byUnit.entries()].map(([unit, quantity]) => ({ unit, quantity: round(quantity) })),
  };
}

const cycleInclude = {
  crop: { select: { name: true, nameBn: true } },
  field: { select: { name: true, areaInAcres: true, farm: { select: { name: true } } } },
  expenses: { orderBy: { date: "asc" as const }, select: { category: true, amount: true, date: true, description: true } },
  harvests: { orderBy: { harvestDate: "asc" as const }, select: { harvestDate: true, quantity: true, unit: true, pricePerUnit: true } },
};

type CycleWithBooks = Awaited<ReturnType<typeof loadCycles>>[number];

function loadCycles(where: object) {
  return prisma.cropCycle.findMany({ where, orderBy: { plantingDate: "asc" }, include: cycleInclude });
}

// One crop season's figures; `withItems` adds every expense and harvest line
function describeCycle(cycle: CycleWithBooks, withItems: boolean) {
  const costs = sumExpenses(cycle.expenses);
  const sales = sumHarvests(cycle.harvests);
  const acres = cycle.field.areaInAcres ?? 0;
  const profit = round(sales.revenue - costs.total);
  const perAcre = (value: number) => (acres > 0 ? round(value / acres) : null);

  return {
    id: cycle.id,
    crop: cycle.crop,
    field: { name: cycle.field.name, areaInAcres: acres || null },
    farm: cycle.field.farm,
    status: cycle.status,
    plantingDate: cycle.plantingDate,
    expectedHarvestDate: cycle.expectedHarvestDate,
    actualHarvestDate: cycle.actualHarvestDate,
    costs,
    sales,
    profit,
    perAcre: { cost: perAcre(costs.total), revenue: perAcre(sales.revenue), profit: perAcre(profit) },
    ...(withItems && {
      expenses: cycle.expenses.map((expense) => ({ ...expense, amount: round(expense.amount) })),
      harvests: cycle.harvests.map((harvest) => ({ ...harvest, revenue: round(harvest.quantity * harvest.pricePerUnit) })),
    }),
  };
}

// A single crop season, with every expense and harvest line
export const getCropReport = serviceHandler(async (userId: string, cropCycleId: string) => {
  const [cycle] = await loadCycles({ id: cropCycleId, field: { farm: { userId } } });
  if (!cycle) throw AppError.notFound("Crop not found");
  return describeCycle(cycle, true);
});

// Every crop planted in a year, plus farm costs that aren't tied to a crop
export const getYearReport = serviceHandler(async (userId: string, year: number) => {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw AppError.unprocessable("Choose a year");
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const [cycles, farmExpenses, years] = await Promise.all([
    loadCycles({ field: { farm: { userId } }, plantingDate: { gte: from, lt: to } }),
    prisma.expense.findMany({
      where: { farm: { userId }, cropCycleId: null, date: { gte: from, lt: to } },
      select: { category: true, amount: true, date: true, description: true },
    }),
    // Years that have any crop, for the year picker
    prisma.cropCycle.findMany({ where: { field: { farm: { userId } } }, select: { plantingDate: true } }),
  ]);

  const crops = cycles.map((cycle) => describeCycle(cycle, false));
  const otherCosts = sumExpenses(farmExpenses);
  const cost = round(crops.reduce((sum, crop) => sum + crop.costs.total, 0) + otherCosts.total);
  const revenue = round(crops.reduce((sum, crop) => sum + crop.sales.revenue, 0));

  return {
    year,
    years: [...new Set(years.map((row) => row.plantingDate.getUTCFullYear()))].sort((a, b) => b - a),
    crops,
    otherCosts,
    totals: {
      cost,
      revenue,
      profit: round(revenue - cost),
      costsByCategory: sumExpenses([...cycles.flatMap((cycle) => cycle.expenses), ...farmExpenses]).byCategory,
    },
  };
});
