import { Router } from "express";
import {
  getSummary,
  getCropDistribution,
  getFinancialSummary,
} from "./dashboard.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, farmerOnly);

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/crop-distribution", getCropDistribution);
dashboardRouter.get("/financial-summary", getFinancialSummary);
