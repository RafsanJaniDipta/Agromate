import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getSummary as getSummaryService,
  getCropDistribution as getCropDistributionService,
  getFinancialSummary as getFinancialSummaryService,
} from "./dashboard.service.js";

export const getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const summary = await getSummaryService(userId);
  sendSuccess(res, 200, "Dashboard summary fetched successfully", summary);
});

export const getCropDistribution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const distribution = await getCropDistributionService(userId);
  sendSuccess(res, 200, "Crop distribution fetched successfully", distribution);
});

export const getFinancialSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { period } = req.query;
  const summary = await getFinancialSummaryService(userId, typeof period === "string" ? period : undefined);
  sendSuccess(res, 200, "Financial summary fetched successfully", summary);
});

export const DashboardController = {
  getSummary,
  getCropDistribution,
  getFinancialSummary,
};
