import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createRecommendation as createRecommendationService,
  getRecommendationsByUserId as getRecommendationsByUserIdService,
  getRecommendationById as getRecommendationByIdService,
  deleteRecommendation as deleteRecommendationService,
} from "./cropRecommendation.service.js";

export const createRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { location, soilType, season, recommendedCrops } = req.body;
  if (!location || !soilType || !recommendedCrops) {
    throw AppError.unprocessable("location, soilType, and recommendedCrops are required");
  }

  const recommendation = await createRecommendationService({
    userId,
    location,
    soilType,
    season,
    recommendedCrops,
  });

  sendSuccess(res, 201, "Crop recommendation recorded successfully", recommendation);
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || (req.query.userId as string);
  if (!userId) {
    throw AppError.unauthorized("userId is required");
  }

  const recommendations = await getRecommendationsByUserIdService(userId);
  sendSuccess(res, 200, "Crop recommendations fetched successfully", recommendations);
});

export const getRecommendationById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const recommendation = await getRecommendationByIdService(id);
  if (!recommendation) {
    throw AppError.notFound("Crop recommendation record not found");
  }

  sendSuccess(res, 200, "Crop recommendation details fetched successfully", recommendation);
});

export const deleteRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const userId = req.user?.id || (req.query.userId as string);
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const deleted = await deleteRecommendationService(id, userId);
  if (deleted.count === 0) {
    throw AppError.notFound("Record not found or unauthorized");
  }

  sendSuccess(res, 200, "Crop recommendation record deleted successfully", { id });
});

export const CropRecommendationController = {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  deleteRecommendation,
};
