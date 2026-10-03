import type { Request, Response } from "express";
import { CropService } from "./crop.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createCrop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, season, growthDays, durationDays, soilTypes, idealSoil, category, optimalTemp, optimalRainfall, description } = req.body;
    if (!name) {
      sendError(res, 422, "Crop name is required");
      return;
    }

    const crop = await CropService.createCrop({
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
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create crop");
  }
};

const getCrops = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, season } = req.query;
    const crops = await CropService.getAllCrops(
      typeof search === "string" ? search : undefined,
      typeof season === "string" ? season : undefined,
    );
    sendSuccess(res, 200, "Crops fetched successfully", crops);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crops");
  }
};

const getCropById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const crop = await CropService.getCropById(id);
    if (!crop) {
      sendError(res, 404, "Crop not found");
      return;
    }

    sendSuccess(res, 200, "Crop details fetched successfully", crop);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch crop details");
  }
};

const updateCrop = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const updated = await CropService.updateCrop(id, req.body);
    sendSuccess(res, 200, "Crop updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update crop");
  }
};

const deleteCrop = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    await CropService.deleteCrop(id);
    sendSuccess(res, 200, "Crop deleted successfully", { message: "Crop deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete crop");
  }
};

export const CropController = {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
};


