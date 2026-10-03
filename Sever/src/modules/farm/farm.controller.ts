import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { createFarm as createFarmService, getFarmsByUserId, getFarmById as getFarmByIdService, updateFarm as updateFarmService, deleteFarm as deleteFarmService } from "./farm.service.js";
import { createField as createFieldService, getFieldsByFarmId as getFieldsByFarmIdService } from "../field/field.service.js";

export const createFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { name, location, totalArea, areaInAcres, soilType } = req.body;
  if (!name || !location) {
    throw AppError.unprocessable("Name and location are required");
  }

  const farm = await createFarmService({
    name,
    location,
    totalArea: totalArea !== undefined ? Number(totalArea) : undefined,
    areaInAcres: areaInAcres !== undefined ? Number(areaInAcres) : undefined,
    soilType,
    userId,
  });

  sendSuccess(res, 201, "Farm created successfully", farm);
});

export const getFarms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const farms = await getFarmsByUserId(userId);
  sendSuccess(res, 200, "Farms fetched successfully", farms);
});

export const getFarmById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const farm = await getFarmByIdService(id, userId);
  if (!farm) {
    throw AppError.notFound("Farm not found");
  }

  sendSuccess(res, 200, "Farm details fetched successfully", farm);
});

export const updateFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const updated = await updateFarmService(id, userId, req.body);
  if (!updated) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 200, "Farm updated successfully", updated);
});

export const deleteFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteFarmService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 200, "Farm deleted successfully", { message: "Farm deleted successfully" });
});

export const createFieldForFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const farmId = String(req.params.farmId || "");
  const { name, area, areaInAcres, soilType } = req.body;
  if (!name) {
    throw AppError.unprocessable("Field name is required");
  }

  const field = await createFieldService({
    farmId,
    name,
    area: area !== undefined ? Number(area) : undefined,
    areaInAcres: areaInAcres !== undefined ? Number(areaInAcres) : undefined,
    soilType,
    userId,
  });

  if (!field) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 201, "Field created successfully", field);
});

export const getFieldsForFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const farmId = String(req.params.farmId || "");
  const fields = await getFieldsByFarmIdService(farmId, userId);
  if (fields === null) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 200, "Fields fetched successfully", fields);
});

export const FarmController = {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  createFieldForFarm,
  getFieldsForFarm,
};
