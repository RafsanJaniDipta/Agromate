import type { Request, Response } from "express";
import { ExpenseService } from "./expense.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export class ExpenseController {
  static async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const { farmId, cropCycleId, category, amount, description, date } = req.body;
      if (!farmId || !category || !amount) {
        sendError(res, 400, "farmId, category, and amount are required");
        return;
      }

      const expense = await ExpenseService.createExpense({
        farmId,
        cropCycleId,
        category,
        amount: Number(amount),
        description,
        date: date ? new Date(date) : undefined,
      });

      sendSuccess(res, 201, "Expense recorded successfully", expense);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to record expense");
    }
  }

  static async getExpenses(req: Request, res: Response): Promise<void> {
    try {
      const farmId = req.query.farmId as string;
      if (!farmId) {
        sendError(res, 400, "farmId query parameter is required");
        return;
      }

      const expenses = await ExpenseService.getExpensesByFarmId(farmId);
      sendSuccess(res, 200, "Expenses fetched successfully", expenses);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to fetch expenses");
    }
  }

  static async getExpenseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const expense = await ExpenseService.getExpenseById(id);
      if (!expense) {
        sendError(res, 404, "Expense not found");
        return;
      }

      sendSuccess(res, 200, "Expense details fetched successfully", expense);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to fetch expense details");
    }
  }

  static async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await ExpenseService.updateExpense(id, req.body);
      sendSuccess(res, 200, "Expense updated successfully", updated);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to update expense");
    }
  }

  static async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await ExpenseService.deleteExpense(id);
      sendSuccess(res, 200, "Expense deleted successfully", { id });
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to delete expense");
    }
  }
}
