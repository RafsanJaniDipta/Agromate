import type { Request, Response } from "express";
import { DashboardService } from "./dashboard.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const summary = await DashboardService.getSummary(userId);
    sendSuccess(res, 200, "Dashboard summary fetched successfully", summary);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch dashboard summary");
  }
};

const getCropDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const distribution = await DashboardService.getCropDistribution(userId);
    sendSuccess(res, 200, "Crop distribution fetched successfully", distribution);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crop distribution");
  }
};

const getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { period } = req.query;
    const summary = await DashboardService.getFinancialSummary(userId, typeof period === "string" ? period : undefined);
    sendSuccess(res, 200, "Financial summary fetched successfully", summary);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch financial summary");
  }
};

export const DashboardController = {
  getSummary,
  getCropDistribution,
  getFinancialSummary,
};

