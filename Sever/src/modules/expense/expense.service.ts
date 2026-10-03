import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateExpenseInput {
  cropCycleId: string;
  category: string;
  amount: number;
  date?: Date | string;
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

export const createExpense = serviceHandler(async (data: CreateExpenseInput) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id: data.cropCycleId },
    include: { field: { include: { farm: true } } },
  });

  if (!cycle || cycle.field.farm.userId !== data.userId) {
    return null;
  }

  return await prisma.expense.create({
    data: {
      farmId: cycle.field.farmId,
      cropCycleId: data.cropCycleId,
      category: data.category as any,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      ...( { notes: data.notes ?? data.description } as any ),
      description: data.notes ?? data.description,
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

  const where: any = {
    farmId: { in: farmIds },
    ...(params.cropCycleId ? { cropCycleId: params.cropCycleId } : {}),
    ...(params.category ? { category: params.category } : {}),
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
      ...(data.category !== undefined ? { category: data.category as any } : {}),
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.notes !== undefined ? { notes: data.notes, description: data.notes } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
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
