import type { Request, Response } from "express";
import { FarmService } from "./farm.service.js";
import { FieldService } from "../field/field.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createFarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { name, location, totalArea, areaInAcres, soilType } = req.body;
    if (!name || !location) {
      sendError(res, 422, "Name and location are required");
      return;
    }

    const farm = await FarmService.createFarm({
      name,
      location,
      totalArea: totalArea !== undefined ? Number(totalArea) : undefined,
      areaInAcres: areaInAcres !== undefined ? Number(areaInAcres) : undefined,
      soilType,
      userId,
    });

    sendSuccess(res, 201, "Farm created successfully", farm);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create farm");
  }
};

const getFarms = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const farms = await FarmService.getFarmsByUserId(userId);
    sendSuccess(res, 200, "Farms fetched successfully", farms);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch farms");
  }
};

const getFarmById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const farm = await FarmService.getFarmById(id, userId);
    if (!farm) {
      sendError(res, 404, "Farm not found");
      return;
    }

    sendSuccess(res, 200, "Farm details fetched successfully", farm);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch farm details");
  }
};

const updateFarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const updated = await FarmService.updateFarm(id, userId, req.body);
    if (!updated) {
      sendError(res, 404, "Farm not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Farm updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update farm");
  }
};

const deleteFarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await FarmService.deleteFarm(id, userId);
    if (!deleted) {
      sendError(res, 404, "Farm not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Farm deleted successfully", { message: "Farm deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete farm");
  }
};

const createFieldForFarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const farmId = String(req.params.farmId || "");
    const { name, area, areaInAcres, soilType } = req.body;
    if (!name) {
      sendError(res, 422, "Field name is required");
      return;
    }

    const field = await FieldService.createField({
      farmId,
      name,
      area: area !== undefined ? Number(area) : undefined,
      areaInAcres: areaInAcres !== undefined ? Number(areaInAcres) : undefined,
      soilType,
      userId,
    });

    if (!field) {
      sendError(res, 404, "Farm not found or unauthorized");
      return;
    }

    sendSuccess(res, 201, "Field created successfully", field);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create field");
  }
};

const getFieldsForFarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const farmId = String(req.params.farmId || "");
    const fields = await FieldService.getFieldsByFarmId(farmId, userId);
    if (fields === null) {
      sendError(res, 404, "Farm not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Fields fetched successfully", fields);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch fields");
  }
};

export const FarmController = {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  createFieldForFarm,
  getFieldsForFarm,
};


