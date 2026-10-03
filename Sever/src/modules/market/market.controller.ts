import type { Request, Response } from "express";
import { MarketService } from "./market.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cropName, pricePerKg, pricePerUnit, location, source, date } = req.body;
    const price = pricePerKg ?? pricePerUnit;
    if (!cropName || !location || price === undefined) {
      sendError(res, 422, "cropName, location, and pricePerKg (or pricePerUnit) are required");
      return;
    }

    const marketPrice = await MarketService.createMarketPrice({
      cropName,
      pricePerKg: Number(price),
      location,
      source,
      date,
    });

    sendSuccess(res, 201, "Market price added successfully", marketPrice);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to add market price");
  }
};

const getMarketPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cropName, location, page, limit } = req.query;
    const result = await MarketService.getMarketPrices({
      cropName: typeof cropName === "string" ? cropName : undefined,
      location: typeof location === "string" ? location : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Market prices fetched successfully",
      data: result.items,
      meta: result.meta,
    });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch market prices");
  }
};

const getTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cropName, days } = req.query;
    if (!cropName || typeof cropName !== "string") {
      sendError(res, 422, "cropName query parameter is required");
      return;
    }

    const trends = await MarketService.getTrends(cropName, days ? Number(days) : 30);
    sendSuccess(res, 200, "Price trends fetched successfully", trends);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch price trends");
  }
};

const getMarketPriceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const marketPrice = await MarketService.getMarketPriceById(id);
    if (!marketPrice) {
      sendError(res, 404, "Market price not found");
      return;
    }

    sendSuccess(res, 200, "Market price details fetched successfully", marketPrice);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch market price details");
  }
};

const updateMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const updated = await MarketService.updateMarketPrice(id, req.body);
    sendSuccess(res, 200, "Market price updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update market price");
  }
};

const deleteMarketPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    await MarketService.deleteMarketPrice(id);
    sendSuccess(res, 200, "Market price deleted successfully", { message: "Market price deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete market price");
  }
};

export const MarketController = {
  createMarketPrice,
  getMarketPrices,
  getTrends,
  getMarketPriceById,
  updateMarketPrice,
  deleteMarketPrice,
};



