import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { createCrop as createCropService, getAllCrops as getAllCropsService, getCropById as getCropByIdService, updateCrop as updateCropService, deleteCrop as deleteCropService } from "./crop.service.js";

export const createCrop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, season, growthDays, durationDays, soilTypes, idealSoil, category, optimalTemp, optimalRainfall, description } = req.body;
  if (!name) {
    throw AppError.unprocessable("Crop name is required");
  }

  const crop = await createCropService({
    name,
    season,
    growthDays: growthDays ? Number(growthDays) : undefined,
    durationDays: durationDays ? Number(durationDays) : undefined,
    soilTypes,
    idealSoil,
    category,
    optimalTemp: optimalTemp ? Number(optimalTemp) : undefined,
    optimalRainfall: optimalRainfall ? Number(optimalRainfall) : undefined,
    description,
  });

  sendSuccess(res, 201, "Crop created successfully", crop);
});

export const getCrops = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { search, season } = req.query;
  const crops = await getAllCropsService(
    typeof search === "string" ? search : undefined,
    typeof season === "string" ? season : undefined,
  );
  sendSuccess(res, 200, "Crops fetched successfully", crops);
});

export const getCropById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const crop = await getCropByIdService(id);
  if (!crop) {
    throw AppError.notFound("Crop not found");
  }

  sendSuccess(res, 200, "Crop details fetched successfully", crop);
});

export const updateCrop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const updated = await updateCropService(id, req.body);
  sendSuccess(res, 200, "Crop updated successfully", updated);
});

export const deleteCrop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  await deleteCropService(id);
  sendSuccess(res, 200, "Crop deleted successfully", { message: "Crop deleted successfully" });
});

export const CropController = {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
};
