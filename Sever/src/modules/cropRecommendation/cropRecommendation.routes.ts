import { Router } from "express";
import {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  deleteRecommendation,
} from "./cropRecommendation.controller.js";

export const cropRecommendationRouter = Router();

cropRecommendationRouter.post("/", createRecommendation);
cropRecommendationRouter.get("/", getRecommendations);
cropRecommendationRouter.get("/:id", getRecommendationById);
cropRecommendationRouter.delete("/:id", deleteRecommendation);
