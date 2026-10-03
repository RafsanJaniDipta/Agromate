import { Router } from "express";
import { CropController } from "./crop.controller.js";

export const cropRouter = Router();

cropRouter.post("/", CropController.createCrop);
cropRouter.get("/", CropController.getCrops);
cropRouter.get("/:id", CropController.getCropById);
cropRouter.put("/:id", CropController.updateCrop);
cropRouter.delete("/:id", CropController.deleteCrop);
