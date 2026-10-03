import { Router } from "express";
import { CropRecommendationController } from "./cropRecommendation.controller.js";

export const cropRecommendationRouter = Router();

cropRecommendationRouter.post("/", CropRecommendationController.createRecommendation);
cropRecommendationRouter.get("/", CropRecommendationController.getRecommendations);
cropRecommendationRouter.get("/:id", CropRecommendationController.getRecommendationById);
cropRecommendationRouter.delete("/:id", CropRecommendationController.deleteRecommendation);
