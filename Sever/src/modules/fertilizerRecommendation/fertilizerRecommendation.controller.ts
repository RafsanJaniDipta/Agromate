import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createRecommendation as createRecommendationService,
  getRecommendationsByUserId as getRecommendationsByUserIdService,
  getRecommendationById as getRecommendationByIdService,
  deleteRecommendation as deleteRecommendationService,
} from "./fertilizerRecommendation.service.js";

export const createRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { farmId, cropName, soilN, soilP, soilK, recommendedN, recommendedP, recommendedK, notes } = req.body;
  if (!cropName || recommendedN === undefined || recommendedP === undefined || recommendedK === undefined) {
    throw AppError.unprocessable("cropName, recommendedN, recommendedP, and recommendedK are required");
  }

  const recommendation = await createRecommendationService({
    userId,
    farmId,
    cropName,
    soilN: soilN ? Number(soilN) : undefined,
    soilP: soilP ? Number(soilP) : undefined,
    soilK: soilK ? Number(soilK) : undefined,
    recommendedN: Number(recommendedN),
    recommendedP: Number(recommendedP),
    recommendedK: Number(recommendedK),
    notes,
  });

  sendSuccess(res, 201, "Fertilizer recommendation created successfully", recommendation);
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id || (req.query.userId as string);
  if (!userId) {
    throw AppError.unauthorized("userId is required");
  }

  const recommendations = await getRecommendationsByUserIdService(userId);
  sendSuccess(res, 200, "Fertilizer recommendations fetched successfully", recommendations);
});

export const getRecommendationById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const recommendation = await getRecommendationByIdService(id);
  if (!recommendation) {
    throw AppError.notFound("Fertilizer recommendation not found");
  }

  sendSuccess(res, 200, "Fertilizer recommendation details fetched successfully", recommendation);
});

export const deleteRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const userId = req.user?.id || (req.query.userId as string);
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const deleted = await deleteRecommendationService(id, userId);
  if (deleted.count === 0) {
    throw AppError.notFound("Recommendation not found or unauthorized");
  }

  sendSuccess(res, 200, "Fertilizer recommendation deleted successfully", { id });
});

export const FertilizerRecommendationController = {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  deleteRecommendation,
};
