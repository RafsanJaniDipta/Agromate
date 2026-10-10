import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import type { PriceCategory } from "../../generated/prisma/client.js";
import {
  PRICE_CATEGORIES,
  createItem as createItemService,
  getAllItemsForAdmin,
  getHighlights as getHighlightsService,
  getHistory as getHistoryService,
  getPrices as getPricesService,
  isKnownDistrict,
  reportPrice as reportPriceService,
  setOfficialPrice as setOfficialPriceService,
  updateItem as updateItemService,
} from "./price.service.js";
import { refreshPrices } from "./price.scheduler.js";

const idOf = (req: Request) => String(req.params.id ?? "");

// GET /api/prices?category=CROP|FERTILIZER|PESTICIDE&district=Bogra
// Farmer reports are summed up for ?district=, or for a signed-in farmer's own district.
export const getPrices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = String(req.query.category ?? "CROP").toUpperCase() as PriceCategory;
  if (!PRICE_CATEGORIES.includes(category)) {
    throw AppError.unprocessable("category must be CROP, FERTILIZER or PESTICIDE");
  }

  const district = typeof req.query.district === "string" && req.query.district ? req.query.district : undefined;
  if (district && !isKnownDistrict(district)) {
    throw AppError.unprocessable("Unknown district");
  }

  sendSuccess(res, 200, "Prices fetched successfully", await getPricesService(category, req.user?.id, district));
});

export const getHighlights = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Price highlights fetched successfully", await getHighlightsService());
});

export const getHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Price history fetched successfully", await getHistoryService(idOf(req)));
});

export const reportPrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { itemId, price } = req.body ?? {};
  if (typeof itemId !== "string" || !itemId) throw AppError.unprocessable("itemId is required");
  sendSuccess(res, 201, "Thanks for reporting the price", await reportPriceService(req.user!.id, itemId, price));
});

export const getAdminItems = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Price items fetched successfully", await getAllItemsForAdmin());
});

export const createItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, "Item created", await createItemService(req.body ?? {}));
});

export const updateItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Item updated", await updateItemService(idOf(req), req.body ?? {}));
});

export const setOfficialPrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Price saved", await setOfficialPriceService(idOf(req), req.body ?? {}));
});

// Fetches TCB's latest prices now instead of waiting for the hourly check
export const importTcb = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await refreshPrices().catch((error: unknown) => {
    throw AppError.badGateway(error instanceof Error ? error.message : "TCB import failed");
  });
  sendSuccess(res, 200, result ? "TCB prices imported" : "An import is already running", result);
});
