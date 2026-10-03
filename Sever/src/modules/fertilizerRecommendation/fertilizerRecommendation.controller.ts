import type { Request, Response } from "express";
import { FertilizerRecommendationService } from "./fertilizerRecommendation.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { farmId, cropName, soilN, soilP, soilK, recommendedN, recommendedP, recommendedK, notes } = req.body;
    if (!cropName || recommendedN === undefined || recommendedP === undefined || recommendedK === undefined) {
      sendError(res, 400, "cropName, recommendedN, recommendedP, and recommendedK are required");
      return;
    }

    const recommendation = await FertilizerRecommendationService.createRecommendation({
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
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create fertilizer recommendation");
  }
};

const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 400, "userId is required");
      return;
    }

    const recommendations = await FertilizerRecommendationService.getRecommendationsByUserId(userId);
    sendSuccess(res, 200, "Fertilizer recommendations fetched successfully", recommendations);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch fertilizer recommendations");
  }
};

const getRecommendationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const recommendation = await FertilizerRecommendationService.getRecommendationById(id);
    if (!recommendation) {
      sendError(res, 404, "Fertilizer recommendation not found");
      return;
    }

    sendSuccess(res, 200, "Fertilizer recommendation details fetched successfully", recommendation);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch fertilizer recommendation details");
  }
};

const deleteRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const deleted = await FertilizerRecommendationService.deleteRecommendation(id, userId);
    if (deleted.count === 0) {
      sendError(res, 404, "Recommendation not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Fertilizer recommendation deleted successfully", { id });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete fertilizer recommendation");
  }
};

export const FertilizerRecommendationController = {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  deleteRecommendation,
};

