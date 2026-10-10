import { Router } from "express";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "./expense.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const expenseRouter = Router();

expenseRouter.use(authenticate, farmerOnly);

expenseRouter.post("/", createExpense);
expenseRouter.get("/", getExpenses);
expenseRouter.get("/:id", getExpenseById);
expenseRouter.patch("/:id", updateExpense);
expenseRouter.put("/:id", updateExpense);
expenseRouter.delete("/:id", deleteExpense);

