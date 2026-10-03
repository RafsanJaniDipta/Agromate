import type { Request, Response } from "express";
import { HarvestService } from "./harvest.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createHarvest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { cropCycleId, harvestDate, quantity, unit, qualityGrade, notes } = req.body;
    if (!cropCycleId || quantity === undefined) {
      sendError(res, 422, "cropCycleId and quantity are required");
      return;
    }

    const harvest = await HarvestService.createHarvest({
      cropCycleId,
      harvestDate,
      quantity: Number(quantity),
      unit,
      qualityGrade,
      notes,
      userId,
    });

    if (!harvest) {
      sendError(res, 404, "Crop cycle not found or unauthorized");
      return;
    }

    sendSuccess(res, 201, "Harvest recorded successfully", harvest);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to record harvest");
  }
};

const getHarvests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { cropCycleId, from, to, page, limit } = req.query;

    const result = await HarvestService.getHarvests(userId, {
      cropCycleId: typeof cropCycleId === "string" ? cropCycleId : undefined,
      from: typeof from === "string" ? from : undefined,
      to: typeof to === "string" ? to : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Harvests fetched successfully",
      data: result.items,
      meta: result.meta,
      summary: result.summary,
    });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch harvests");
  }
};

const getHarvestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const harvest = await HarvestService.getHarvestById(id, userId);
    if (!harvest) {
      sendError(res, 404, "Harvest not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Harvest details fetched successfully", harvest);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch harvest details");
  }
};

const updateHarvest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const updated = await HarvestService.updateHarvest(id, userId, req.body);
    if (!updated) {
      sendError(res, 404, "Harvest not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Harvest updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update harvest");
  }
};

const deleteHarvest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await HarvestService.deleteHarvest(id, userId);
    if (!deleted) {
      sendError(res, 404, "Harvest not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Harvest deleted successfully", { message: "Harvest deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete harvest");
  }
};

export const HarvestController = {
  createHarvest,
  getHarvests,
  getHarvestById,
  updateHarvest,
  deleteHarvest,
};


