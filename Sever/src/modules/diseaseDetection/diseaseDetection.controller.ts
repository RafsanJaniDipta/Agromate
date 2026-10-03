import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createDetection as createDetectionService,
  getDetections as getDetectionsService,
  getDetectionById as getDetectionByIdService,
} from "./diseaseDetection.service.js";

export const createDetection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { image, imageUrl, cropId } = req.body;
  const img = image || imageUrl;
  if (!img) {
    throw AppError.unprocessable("image (or imageUrl) is required");
  }

  const result = await createDetectionService({
    userId,
    image,
    imageUrl,
    cropId,
  });

  sendSuccess(res, 201, "Disease detection completed successfully", result);
});

export const getDetections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { page, limit } = req.query;
  const result = await getDetectionsService(
    userId,
    page ? Number(page) : 1,
    limit ? Number(limit) : 10,
  );

  sendSuccess(res, 200, "Disease detections fetched successfully", { items: result.items, meta: result.meta });
});

export const getDetectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const detection = await getDetectionByIdService(id, userId);
  if (!detection) {
    throw AppError.notFound("Disease detection record not found or unauthorized");
  }

  sendSuccess(res, 200, "Disease detection details fetched successfully", detection);
});

export const DiseaseDetectionController = {
  createDetection,
  getDetections,
  getDetectionById,
};
