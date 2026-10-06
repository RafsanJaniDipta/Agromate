import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { parseEnum } from "../../utils/enum.js";
import { ExpenseCategory, type Prisma } from "../../generated/prisma/client.js";

export interface CreateExpenseInput {
  // A farm-wide expense needs only farmId; a crop expense gives cropCycleId and the farm follows from it
  farmId?: string;
  cropCycleId?: string;
  category: string;
  amount: number;
  date?: Date | string;
  // Older clients send this name for description
  notes?: string;
  description?: string;
  userId: string;
}

export interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  date?: Date | string;
  notes?: string;
  description?: string;
}

// The farm the expense belongs to, or null when it isn't the user's
async function resolveOwnFarmId(data: CreateExpenseInput): Promise<string | null> {
  if (data.cropCycleId) {
    const cycle = await prisma.cropCycle.findFirst({
      where: { id: data.cropCycleId, field: { farm: { userId: data.userId } } },
      select: { field: { select: { farmId: true } } },
    });
    return cycle?.field.farmId ?? null;
  }

  const farm = await prisma.farm.findFirst({
    where: { id: data.farmId, userId: data.userId },
    select: { id: true },
  });
  return farm?.id ?? null;
}

export const createExpense = serviceHandler(async (data: CreateExpenseInput) => {
  const farmId = await resolveOwnFarmId(data);
  if (!farmId) return null;

  return await prisma.expense.create({
    data: {
      farmId,
      cropCycleId: data.cropCycleId,
      category: parseEnum(ExpenseCategory, data.category, "category"),
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description ?? data.notes,
    },
    include: { cropCycle: true },
  });
});

export const getExpenses = serviceHandler(async (
  userId: string,
  params: {
    cropCycleId?: string;
    category?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  },
) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const farms = await prisma.farm.findMany({ where: { userId }, select: { id: true } });
  const farmIds = farms.map((f) => f.id);

  const where: Prisma.ExpenseWhereInput = {
    farmId: { in: farmIds },
    ...(params.cropCycleId ? { cropCycleId: params.cropCycleId } : {}),
    ...(params.category ? { category: parseEnum(ExpenseCategory, params.category, "category") } : {}),
    ...(params.from || params.to
      ? {
          date: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
          },
        }
      : {}),
  };

  const [total, items, aggregate] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: { cropCycle: true },
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return {
    items,
    meta: { page, limit, total },
    summary: {
      totalAmount: aggregate._sum.amount || 0,
    },
  };
});

export const getExpenseById = serviceHandler(async (id: string, userId: string) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { farm: true, cropCycle: true },
  });

  if (!expense || expense.farm.userId !== userId) {
    return null;
  }

  return expense;
});

export const updateExpense = serviceHandler(async (id: string, userId: string, data: UpdateExpenseInput) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { farm: true },
  });

  if (!expense || expense.farm.userId !== userId) {
    return null;
  }

  return await prisma.expense.update({
    where: { id },
    data: {
      ...(data.category !== undefined ? { category: parseEnum(ExpenseCategory, data.category, "category") } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...((data.description ?? data.notes) !== undefined ? { description: data.description ?? data.notes } : {}),
    },
    include: { cropCycle: true },
  });
});

export const deleteExpense = serviceHandler(async (id: string, userId: string) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { farm: true },
  });

  if (!expense || expense.farm.userId !== userId) {
    return false;
  }

  await prisma.expense.delete({ where: { id } });
  return true;
});

export const ExpenseService = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
