import type { Request, Response } from "express";
import { ExpenseService } from "./expense.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { cropCycleId, category, amount, date, notes, description } = req.body;
    if (!cropCycleId || !category || amount === undefined) {
      sendError(res, 422, "cropCycleId, category, and amount are required");
      return;
    }

    const expense = await ExpenseService.createExpense({
      cropCycleId,
      category,
      amount: Number(amount),
      date,
      notes,
      description,
      userId,
    });

    if (!expense) {
      sendError(res, 404, "Crop cycle not found or unauthorized");
      return;
    }

    sendSuccess(res, 201, "Expense recorded successfully", expense);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to record expense");
  }
};

const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { cropCycleId, category, from, to, page, limit } = req.query;

    const result = await ExpenseService.getExpenses(userId, {
      cropCycleId: typeof cropCycleId === "string" ? cropCycleId : undefined,
      category: typeof category === "string" ? category : undefined,
      from: typeof from === "string" ? from : undefined,
      to: typeof to === "string" ? to : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: result.items,
      meta: result.meta,
      summary: result.summary,
    });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch expenses");
  }
};

const getExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const expense = await ExpenseService.getExpenseById(id, userId);
    if (!expense) {
      sendError(res, 404, "Expense not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Expense details fetched successfully", expense);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch expense details");
  }
};

const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const updated = await ExpenseService.updateExpense(id, userId, req.body);
    if (!updated) {
      sendError(res, 404, "Expense not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Expense updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update expense");
  }
};

const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await ExpenseService.deleteExpense(id, userId);
    if (!deleted) {
      sendError(res, 404, "Expense not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Expense deleted successfully", { message: "Expense deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete expense");
  }
};

export const ExpenseController = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};


