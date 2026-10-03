import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, farmerOnly);

dashboardRouter.get("/summary", DashboardController.getSummary);
dashboardRouter.get("/crop-distribution", DashboardController.getCropDistribution);
dashboardRouter.get("/financial-summary", DashboardController.getFinancialSummary);
