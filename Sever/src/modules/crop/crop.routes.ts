import { Router } from "express";
import { CropController } from "./crop.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";

export const cropRouter = Router();

cropRouter.get("/", CropController.getCrops);
cropRouter.get("/:id", CropController.getCropById);

cropRouter.post("/", authenticate, adminOnly, CropController.createCrop);
cropRouter.patch("/:id", authenticate, adminOnly, CropController.updateCrop);
cropRouter.put("/:id", authenticate, adminOnly, CropController.updateCrop);
cropRouter.delete("/:id", authenticate, adminOnly, CropController.deleteCrop);

