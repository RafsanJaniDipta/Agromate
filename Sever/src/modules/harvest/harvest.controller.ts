import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createHarvest as createHarvestService,
  getHarvests as getHarvestsService,
  getHarvestById as getHarvestByIdService,
  updateHarvest as updateHarvestService,
  deleteHarvest as deleteHarvestService,
} from "./harvest.service.js";

export const createHarvest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { cropCycleId, harvestDate, quantity, unit, qualityGrade, notes } = req.body;
  if (!cropCycleId || quantity === undefined) {
    throw AppError.unprocessable("cropCycleId and quantity are required");
  }

  const harvest = await createHarvestService({
    cropCycleId,
    harvestDate,
    quantity: Number(quantity),
    unit,
    qualityGrade,
    notes,
    userId,
  });

  if (!harvest) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }

  sendSuccess(res, 201, "Harvest recorded successfully", harvest);
});

export const getHarvests = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { cropCycleId, from, to, page, limit } = req.query;

  const result = await getHarvestsService(userId, {
    cropCycleId: typeof cropCycleId === "string" ? cropCycleId : undefined,
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendSuccess(res, 200, "Harvests fetched successfully", {
    items: result.items,
    meta: result.meta,
    summary: result.summary,
  });
});

export const getHarvestById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const harvest = await getHarvestByIdService(id, userId);
  if (!harvest) {
    throw AppError.notFound("Harvest not found or unauthorized");
  }

  sendSuccess(res, 200, "Harvest details fetched successfully", harvest);
});

export const updateHarvest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const updated = await updateHarvestService(id, userId, req.body);
  if (!updated) {
    throw AppError.notFound("Harvest not found or unauthorized");
  }

  sendSuccess(res, 200, "Harvest updated successfully", updated);
});

export const deleteHarvest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteHarvestService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Harvest not found or unauthorized");
  }

  sendSuccess(res, 200, "Harvest deleted successfully", { message: "Harvest deleted successfully" });
});

export const HarvestController = {
  createHarvest,
  getHarvests,
  getHarvestById,
  updateHarvest,
  deleteHarvest,
};
