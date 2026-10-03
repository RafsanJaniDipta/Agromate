import { Router } from "express";
import { MarketController } from "./market.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";

export const marketRouter = Router();

marketRouter.get("/", MarketController.getMarketPrices);
marketRouter.get("/trends", authenticate, MarketController.getTrends);
marketRouter.get("/:id", MarketController.getMarketPriceById);

marketRouter.post("/", authenticate, adminOnly, MarketController.createMarketPrice);
marketRouter.patch("/:id", authenticate, adminOnly, MarketController.updateMarketPrice);
marketRouter.put("/:id", authenticate, adminOnly, MarketController.updateMarketPrice);
marketRouter.delete("/:id", authenticate, adminOnly, MarketController.deleteMarketPrice);

