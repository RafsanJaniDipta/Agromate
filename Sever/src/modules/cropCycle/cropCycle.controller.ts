import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createCropCycle as createCropCycleService,
  getCropCycles as getCropCyclesService,
  getCalendarEvents as getCalendarEventsService,
  getCropCycleById as getCropCycleByIdService,
  updateCropCycle as updateCropCycleService,
  deleteCropCycle as deleteCropCycleService,
} from "./cropCycle.service.js";

export const createCropCycle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { fieldId, cropId, plantingDate, startDate, expectedHarvestDate, status, growthStage, notes } = req.body;
  if (!fieldId || !cropId) {
    throw AppError.unprocessable("fieldId and cropId are required");
  }

  const cropCycle = await createCropCycleService({
    fieldId,
    cropId,
    plantingDate,
    startDate,
    expectedHarvestDate,
    status,
    growthStage,
    notes,
    userId,
  });

  if (!cropCycle) {
    throw AppError.notFound("Field not found or unauthorized");
  }

  sendSuccess(res, 201, "Crop cycle created successfully", cropCycle);
});

export const getCropCycles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { fieldId, status } = req.query;
  const cropCycles = await getCropCyclesService(
    userId,
    typeof fieldId === "string" ? fieldId : undefined,
    typeof status === "string" ? status : undefined,
  );
  sendSuccess(res, 200, "Crop cycles fetched successfully", cropCycles);
});

export const getCalendarEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { from, to } = req.query;
  const events = await getCalendarEventsService(
    userId,
    typeof from === "string" ? from : undefined,
    typeof to === "string" ? to : undefined,
  );
  sendSuccess(res, 200, "Calendar events fetched successfully", events);
});

export const getCropCycleById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const cropCycle = await getCropCycleByIdService(id, userId);
  if (!cropCycle) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }

  sendSuccess(res, 200, "Crop cycle details fetched successfully", cropCycle);
});

export const updateCropCycle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const updated = await updateCropCycleService(id, userId, req.body);
  if (!updated) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }

  sendSuccess(res, 200, "Crop cycle updated successfully", updated);
});

export const deleteCropCycle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteCropCycleService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }

  sendSuccess(res, 200, "Crop cycle deleted successfully", { message: "Crop cycle deleted successfully" });
});

export const CropCycleController = {
  createCropCycle,
  getCropCycles,
  getCalendarEvents,
  getCropCycleById,
  updateCropCycle,
  deleteCropCycle,
};
