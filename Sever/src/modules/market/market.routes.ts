import { Router } from "express";
import {
  getMarketPrices,
  getTrends,
  getMarketPriceById,
  createMarketPrice,
  updateMarketPrice,
  deleteMarketPrice,
} from "./market.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";

export const marketRouter = Router();

marketRouter.get("/", getMarketPrices);
marketRouter.get("/trends", authenticate, getTrends);
marketRouter.get("/:id", getMarketPriceById);

marketRouter.post("/", authenticate, adminOnly, createMarketPrice);
marketRouter.patch("/:id", authenticate, adminOnly, updateMarketPrice);
marketRouter.put("/:id", authenticate, adminOnly, updateMarketPrice);
marketRouter.delete("/:id", authenticate, adminOnly, deleteMarketPrice);

