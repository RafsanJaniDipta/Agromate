import type { Request, Response } from "express";
import { FarmService } from "./farm.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export class FarmController {
  static async createFarm(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        sendError(res, 401, "User is not authenticated");
        return;
      }

      const { name, location, areaInAcres, soilType } = req.body;
      if (!name || !location || !areaInAcres) {
        sendError(res, 400, "Name, location, and areaInAcres are required");
        return;
      }

      const farm = await FarmService.createFarm({
        name,
        location,
        areaInAcres: Number(areaInAcres),
        soilType,
        userId,
      });

      sendSuccess(res, 201, "Farm created successfully", farm);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to create farm");
    }
  }

  static async getFarms(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req.query.userId as string);
      if (!userId) {
        sendError(res, 400, "userId is required to fetch farms");
        return;
      }

      const farms = await FarmService.getFarmsByUserId(userId);
      sendSuccess(res, 200, "Farms fetched successfully", farms);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to fetch farms");
    }
  }

  static async getFarmById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const farm = await FarmService.getFarmById(id);
      if (!farm) {
        sendError(res, 404, "Farm not found");
        return;
      }

      sendSuccess(res, 200, "Farm details fetched successfully", farm);
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to fetch farm details");
    }
  }

  static async updateFarm(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || req.body.userId;
      if (!userId) {
        sendError(res, 401, "User is not authenticated");
        return;
      }

      const updated = await FarmService.updateFarm(id, userId, req.body);
      if (updated.count === 0) {
        sendError(res, 404, "Farm not found or unauthorized to update");
        return;
      }

      sendSuccess(res, 200, "Farm updated successfully", { id });
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to update farm");
    }
  }

  static async deleteFarm(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req.query.userId as string);
      if (!userId) {
        sendError(res, 401, "User is not authenticated");
        return;
      }

      const deleted = await FarmService.deleteFarm(id, userId);
      if (deleted.count === 0) {
        sendError(res, 404, "Farm not found or unauthorized to delete");
        return;
      }

      sendSuccess(res, 200, "Farm deleted successfully", { id });
    } catch (error: any) {
      sendError(res, 500, error.message || "Failed to delete farm");
    }
  }
}
