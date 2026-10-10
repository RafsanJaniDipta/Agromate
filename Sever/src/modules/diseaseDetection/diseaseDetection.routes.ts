import { Router } from "express";
import {
  createDetection,
  deleteDetection,
  getDetections,
  getDetectionById,
} from "./diseaseDetection.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

// A farmer's saved AI disease checks (the check itself runs in the client's /api/diagnose)
export const diseaseDetectionRouter = Router();

diseaseDetectionRouter.use(authenticate, farmerOnly);

diseaseDetectionRouter.post("/", upload.single("image"), createDetection);
diseaseDetectionRouter.get("/", getDetections);
diseaseDetectionRouter.get("/:id", getDetectionById);
diseaseDetectionRouter.delete("/:id", deleteDetection);
