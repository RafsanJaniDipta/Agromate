import type { Request, Response } from "express";
import { DiseaseDetectionService } from "./diseaseDetection.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createDetection = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { image, imageUrl, cropId } = req.body;
    const img = image || imageUrl;
    if (!img) {
      sendError(res, 422, "image (or imageUrl) is required");
      return;
    }

    const result = await DiseaseDetectionService.createDetection({
      userId,
      image,
      imageUrl,
      cropId,
    });

    sendSuccess(res, 201, "Disease detection completed successfully", result);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to process disease detection");
  }
};

const getDetections = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { page, limit } = req.query;
    const result = await DiseaseDetectionService.getDetections(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );

    res.status(200).json({
      success: true,
      message: "Disease detections fetched successfully",
      data: result.items,
      meta: result.meta,
    });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch disease detections");
  }
};

const getDetectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const detection = await DiseaseDetectionService.getDetectionById(id, userId);
    if (!detection) {
      sendError(res, 404, "Disease detection record not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Disease detection details fetched successfully", detection);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch disease detection details");
  }
};

export const DiseaseDetectionController = {
  createDetection,
  getDetections,
  getDetectionById,
};


