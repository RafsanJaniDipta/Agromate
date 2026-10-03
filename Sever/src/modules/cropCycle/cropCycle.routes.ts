import { Router } from "express";
import { CropCycleController } from "./cropCycle.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const cropCycleRouter = Router();

cropCycleRouter.use(authenticate, farmerOnly);

cropCycleRouter.post("/", CropCycleController.createCropCycle);
cropCycleRouter.get("/", CropCycleController.getCropCycles);
cropCycleRouter.get("/calendar", CropCycleController.getCalendarEvents);
cropCycleRouter.get("/:id", CropCycleController.getCropCycleById);
cropCycleRouter.patch("/:id", CropCycleController.updateCropCycle);
cropCycleRouter.put("/:id", CropCycleController.updateCropCycle);
cropCycleRouter.delete("/:id", CropCycleController.deleteCropCycle);

