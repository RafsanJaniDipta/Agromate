import { Router } from "express";
import { FertilizerRecommendationController } from "./fertilizerRecommendation.controller.js";

export const fertilizerRecommendationRouter = Router();

fertilizerRecommendationRouter.post("/", FertilizerRecommendationController.createRecommendation);
fertilizerRecommendationRouter.get("/", FertilizerRecommendationController.getRecommendations);
fertilizerRecommendationRouter.get("/:id", FertilizerRecommendationController.getRecommendationById);
fertilizerRecommendationRouter.delete("/:id", FertilizerRecommendationController.deleteRecommendation);
