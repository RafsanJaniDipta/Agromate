import { Router } from "express";
import { createRecommendation, deleteRecommendation, getRecommendations } from "./cropRecommendation.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const cropRecommendationRouter = Router();

cropRecommendationRouter.use(authenticate, farmerOnly);

cropRecommendationRouter.post("/", createRecommendation);
cropRecommendationRouter.get("/", getRecommendations);
cropRecommendationRouter.delete("/:id", deleteRecommendation);
