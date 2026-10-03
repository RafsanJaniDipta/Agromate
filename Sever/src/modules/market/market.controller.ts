import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendPaginatedSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createMarketPrice as createMarketPriceService,
  getMarketPrices as getMarketPricesService,
  getTrends as getTrendsService,
  getMarketPriceById as getMarketPriceByIdService,
  updateMarketPrice as updateMarketPriceService,
  deleteMarketPrice as deleteMarketPriceService,
} from "./market.service.js";

export const createMarketPrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cropName, pricePerKg, pricePerUnit, location, source, date } = req.body;
  const price = pricePerKg ?? pricePerUnit;
  if (!cropName || !location || price === undefined) {
    throw AppError.unprocessable("cropName, location, and pricePerKg (or pricePerUnit) are required");
  }

  const marketPrice = await createMarketPriceService({
    cropName,
    pricePerKg: Number(price),
    location,
    source,
    date,
  });

  sendSuccess(res, 201, "Market price added successfully", marketPrice);
});

export const getMarketPrices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cropName, location, page, limit } = req.query;
  const result = await getMarketPricesService({
    cropName: typeof cropName === "string" ? cropName : undefined,
    location: typeof location === "string" ? location : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendPaginatedSuccess(res, 200, "Market prices fetched successfully", result.items, result.meta);
});

export const getTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cropName, days } = req.query;
  if (!cropName || typeof cropName !== "string") {
    throw AppError.unprocessable("cropName query parameter is required");
  }

  const trends = await getTrendsService(cropName, days ? Number(days) : 30);
  sendSuccess(res, 200, "Price trends fetched successfully", trends);
});

export const getMarketPriceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const marketPrice = await getMarketPriceByIdService(id);
  if (!marketPrice) {
    throw AppError.notFound("Market price not found");
  }

  sendSuccess(res, 200, "Market price details fetched successfully", marketPrice);
});

export const updateMarketPrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const updated = await updateMarketPriceService(id, req.body);
  sendSuccess(res, 200, "Market price updated successfully", updated);
});

export const deleteMarketPrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  await deleteMarketPriceService(id);
  sendSuccess(res, 200, "Market price deleted successfully", { message: "Market price deleted successfully" });
});

export const MarketController = {
  createMarketPrice,
  getMarketPrices,
  getTrends,
  getMarketPriceById,
  updateMarketPrice,
  deleteMarketPrice,
};
