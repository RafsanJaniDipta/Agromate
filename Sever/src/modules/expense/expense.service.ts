import { prisma } from "../../config/database.js";
import type { ExpenseCategory } from "../../generated/prisma/index.js";

export interface CreateExpenseInput {
  farmId: string;
  cropCycleId?: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date?: Date;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  amount?: number;
  description?: string;
  date?: Date;
}

export class ExpenseService {
  static async createExpense(data: CreateExpenseInput) {
    return prisma.expense.create({ data });
  }

  static async getExpensesByFarmId(farmId: string) {
    return prisma.expense.findMany({
      where: { farmId },
      include: {
        cropCycle: {
          include: { crop: true },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  static async getExpenseById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: { farm: true, cropCycle: true },
    });
  }

  static async updateExpense(id: string, data: UpdateExpenseInput) {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  static async deleteExpense(id: string) {
    return prisma.expense.delete({
      where: { id },
    });
  }
}
