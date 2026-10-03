import type { Request, Response } from "express";
import { CropRecommendationService } from "./cropRecommendation.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { location, soilType, season, recommendedCrops } = req.body;
    if (!location || !soilType || !recommendedCrops) {
      sendError(res, 400, "location, soilType, and recommendedCrops are required");
      return;
    }

    const recommendation = await CropRecommendationService.createRecommendation({
      userId,
      location,
      soilType,
      season,
      recommendedCrops,
    });

    sendSuccess(res, 201, "Crop recommendation recorded successfully", recommendation);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to record crop recommendation");
  }
};

const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 400, "userId is required");
      return;
    }

    const recommendations = await CropRecommendationService.getRecommendationsByUserId(userId);
    sendSuccess(res, 200, "Crop recommendations fetched successfully", recommendations);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crop recommendations");
  }
};

const getRecommendationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recommendation = await CropRecommendationService.getRecommendationById(id);
    if (!recommendation) {
      sendError(res, 404, "Crop recommendation record not found");
      return;
    }

    sendSuccess(res, 200, "Crop recommendation details fetched successfully", recommendation);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crop recommendation details");
  }
};

const deleteRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const deleted = await CropRecommendationService.deleteRecommendation(id, userId);
    if (deleted.count === 0) {
      sendError(res, 404, "Record not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Crop recommendation record deleted successfully", { id });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete crop recommendation record");
  }
};

export const CropRecommendationController = {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  deleteRecommendation,
};

