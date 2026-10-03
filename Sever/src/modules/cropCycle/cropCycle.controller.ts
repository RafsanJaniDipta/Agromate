import type { Request, Response } from "express";
import { CropCycleService } from "./cropCycle.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createCropCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { fieldId, cropId, plantingDate, startDate, expectedHarvestDate, growthStage, notes } = req.body;
    if (!fieldId || !cropId) {
      sendError(res, 422, "fieldId and cropId are required");
      return;
    }

    const cropCycle = await CropCycleService.createCropCycle({
      fieldId,
      cropId,
      plantingDate,
      startDate,
      expectedHarvestDate,
      growthStage,
      notes,
      userId,
    });

    if (!cropCycle) {
      sendError(res, 404, "Field not found or unauthorized");
      return;
    }

    sendSuccess(res, 201, "Crop cycle created successfully", cropCycle);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create crop cycle");
  }
};

const getCropCycles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { fieldId, status } = req.query;
    const cropCycles = await CropCycleService.getCropCycles(
      userId,
      typeof fieldId === "string" ? fieldId : undefined,
      typeof status === "string" ? status : undefined,
    );
    sendSuccess(res, 200, "Crop cycles fetched successfully", cropCycles);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crop cycles");
  }
};

const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { from, to } = req.query;
    const events = await CropCycleService.getCalendarEvents(
      userId,
      typeof from === "string" ? from : undefined,
      typeof to === "string" ? to : undefined,
    );
    sendSuccess(res, 200, "Calendar events fetched successfully", events);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch calendar events");
  }
};

const getCropCycleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const cropCycle = await CropCycleService.getCropCycleById(id, userId);
    if (!cropCycle) {
      sendError(res, 404, "Crop cycle not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Crop cycle details fetched successfully", cropCycle);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crop cycle details");
  }
};

const updateCropCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const updated = await CropCycleService.updateCropCycle(id, userId, req.body);
    if (!updated) {
      sendError(res, 404, "Crop cycle not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Crop cycle updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update crop cycle");
  }
};

const deleteCropCycle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await CropCycleService.deleteCropCycle(id, userId);
    if (!deleted) {
      sendError(res, 404, "Crop cycle not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Crop cycle deleted successfully", { message: "Crop cycle deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete crop cycle");
  }
};

export const CropCycleController = {
  createCropCycle,
  getCropCycles,
  getCalendarEvents,
  getCropCycleById,
  updateCropCycle,
  deleteCropCycle,
};


