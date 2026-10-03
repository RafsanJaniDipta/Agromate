import { Router } from "express";
import {
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  deleteRecommendation,
} from "./fertilizerRecommendation.controller.js";

export const fertilizerRecommendationRouter = Router();

fertilizerRecommendationRouter.post("/", createRecommendation);
fertilizerRecommendationRouter.get("/", getRecommendations);
fertilizerRecommendationRouter.get("/:id", getRecommendationById);
fertilizerRecommendationRouter.delete("/:id", deleteRecommendation);
