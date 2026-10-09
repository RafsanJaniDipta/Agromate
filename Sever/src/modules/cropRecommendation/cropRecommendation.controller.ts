import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { deleteCropRecommendation, getCropHistory, recommendCrops } from "./cropRecommendation.service.js";

// POST { fieldId?, soilType?, month? } → crops ranked for that land and month, with reasons
export const createRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, "Crop recommendation ready", await recommendCrops(req.user!.id, req.body ?? {}));
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Recommendations fetched successfully", await getCropHistory(req.user!.id));
});

export const deleteRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Recommendation deleted", await deleteCropRecommendation(req.user!.id, String(req.params.id ?? "")));
});
