import { Router } from "express";
import { ExpenseController } from "./expense.controller.js";

export const expenseRouter = Router();

expenseRouter.post("/", ExpenseController.createExpense);
expenseRouter.get("/", ExpenseController.getExpenses);
expenseRouter.get("/:id", ExpenseController.getExpenseById);
expenseRouter.put("/:id", ExpenseController.updateExpense);
expenseRouter.delete("/:id", ExpenseController.deleteExpense);
