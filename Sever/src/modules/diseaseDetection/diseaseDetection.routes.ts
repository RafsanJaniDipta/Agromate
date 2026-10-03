import { Router } from "express";
import { DiseaseDetectionController } from "./diseaseDetection.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const diseaseDetectionRouter = Router();

diseaseDetectionRouter.use(authenticate, farmerOnly);

diseaseDetectionRouter.post("/", DiseaseDetectionController.createDetection);
diseaseDetectionRouter.get("/", DiseaseDetectionController.getDetections);
diseaseDetectionRouter.get("/:id", DiseaseDetectionController.getDetectionById);

