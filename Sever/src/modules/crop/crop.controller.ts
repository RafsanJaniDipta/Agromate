import type { Request, Response } from "express";
import { CropService } from "./crop.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export class CropController {
  static async createCrop(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, idealSoil, optimalTemp, optimalRainfall, durationDays, description } = req.body;
      if (!name) {
        sendError(res, 400, "Crop name is required");
        return;
      }

      const crop = await CropService.createCrop({
        name,
        category,
        idealSoil,
        optimalTemp: optimalTemp ? Number(optimalTemp) : undefined,
        optimalRainfall: optimalRainfall ? Number(optimalRainfall) : undefined,
        durationDays: durationDays ? Number(durationDays) : undefined,
        description,
      });

      sendSuccess(res, 201, "Crop created successfully", crop);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to create crop");
    }
  }

  static async getCrops(_req: Request, res: Response): Promise<void> {
    try {
      const crops = await CropService.getAllCrops();
      sendSuccess(res, 200, "Crops fetched successfully", crops);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to fetch crops");
    }
  }

  static async getCropById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const crop = await CropService.getCropById(id);
      if (!crop) {
        sendError(res, 404, "Crop not found");
        return;
      }

      sendSuccess(res, 200, "Crop details fetched successfully", crop);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to fetch crop details");
    }
  }

  static async updateCrop(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await CropService.updateCrop(id, req.body);
      sendSuccess(res, 200, "Crop updated successfully", updated);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to update crop");
    }
  }

  static async deleteCrop(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await CropService.deleteCrop(id);
      sendSuccess(res, 200, "Crop deleted successfully", { id });
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to delete crop");
    }
  }
}
