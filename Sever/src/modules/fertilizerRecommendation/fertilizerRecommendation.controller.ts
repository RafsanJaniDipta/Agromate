import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  deleteFertilizerRecommendation,
  getFertilizerHistory,
  recommendFertilizer,
} from "./fertilizerRecommendation.service.js";

// POST { cropId, fieldId?, areaAcres?, fertility? } → doses, bags and cost for that land
export const createRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, "Fertilizer recommendation ready", await recommendFertilizer(req.user!.id, req.body ?? {}));
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Recommendations fetched successfully", await getFertilizerHistory(req.user!.id));
});

export const deleteRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await deleteFertilizerRecommendation(req.user!.id, String(req.params.id ?? ""));
  sendSuccess(res, 200, "Recommendation deleted", result);
});
