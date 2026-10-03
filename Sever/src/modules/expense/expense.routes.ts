import { Router } from "express";
import { ExpenseController } from "./expense.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const expenseRouter = Router();

expenseRouter.use(authenticate, farmerOnly);

expenseRouter.post("/", ExpenseController.createExpense);
expenseRouter.get("/", ExpenseController.getExpenses);
expenseRouter.get("/:id", ExpenseController.getExpenseById);
expenseRouter.patch("/:id", ExpenseController.updateExpense);
expenseRouter.put("/:id", ExpenseController.updateExpense);
expenseRouter.delete("/:id", ExpenseController.deleteExpense);

