import { Router } from "express";
import {
  createDetection,
  getDetections,
  getDetectionById,
} from "./diseaseDetection.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const diseaseDetectionRouter = Router();

diseaseDetectionRouter.use(authenticate, farmerOnly);

diseaseDetectionRouter.post("/", createDetection);
diseaseDetectionRouter.get("/", getDetections);
diseaseDetectionRouter.get("/:id", getDetectionById);

