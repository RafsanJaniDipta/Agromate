import { Router } from "express";
import { createRecommendation, deleteRecommendation, getRecommendations } from "./fertilizerRecommendation.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const fertilizerRecommendationRouter = Router();

fertilizerRecommendationRouter.use(authenticate, farmerOnly);

fertilizerRecommendationRouter.post("/", createRecommendation);
fertilizerRecommendationRouter.get("/", getRecommendations);
fertilizerRecommendationRouter.delete("/:id", deleteRecommendation);
