import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createExpense as createExpenseService,
  getExpenses as getExpensesService,
  getExpenseById as getExpenseByIdService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
} from "./expense.service.js";

export const createExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { cropCycleId, category, amount, date, notes, description } = req.body;
  if (!cropCycleId || !category || amount === undefined) {
    throw AppError.unprocessable("cropCycleId, category, and amount are required");
  }

  const expense = await createExpenseService({
    cropCycleId,
    category,
    amount: Number(amount),
    date,
    notes,
    description,
    userId,
  });

  if (!expense) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }

  sendSuccess(res, 201, "Expense recorded successfully", expense);
});

export const getExpenses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { cropCycleId, category, from, to, page, limit } = req.query;

  const result = await getExpensesService(userId, {
    cropCycleId: typeof cropCycleId === "string" ? cropCycleId : undefined,
    category: typeof category === "string" ? category : undefined,
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendSuccess(res, 200, "Expenses fetched successfully", {
    items: result.items,
    meta: result.meta,
    summary: result.summary,
  });
});

export const getExpenseById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const expense = await getExpenseByIdService(id, userId);
  if (!expense) {
    throw AppError.notFound("Expense not found or unauthorized");
  }

  sendSuccess(res, 200, "Expense details fetched successfully", expense);
});

export const updateExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const updated = await updateExpenseService(id, userId, req.body);
  if (!updated) {
    throw AppError.notFound("Expense not found or unauthorized");
  }

  sendSuccess(res, 200, "Expense updated successfully", updated);
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteExpenseService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Expense not found or unauthorized");
  }

  sendSuccess(res, 200, "Expense deleted successfully", { message: "Expense deleted successfully" });
});

export const ExpenseController = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
