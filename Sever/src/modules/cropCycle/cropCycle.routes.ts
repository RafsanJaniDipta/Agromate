import { Router } from "express";
import {
  createCropCycle,
  getCropCycles,
  getCalendarEvents,
  getCropCycleById,
  updateCropCycle,
  deleteCropCycle,
} from "./cropCycle.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const cropCycleRouter = Router();

cropCycleRouter.use(authenticate, farmerOnly);

cropCycleRouter.post("/", createCropCycle);
cropCycleRouter.get("/", getCropCycles);
cropCycleRouter.get("/calendar", getCalendarEvents);
cropCycleRouter.get("/:id", getCropCycleById);
cropCycleRouter.patch("/:id", updateCropCycle);
cropCycleRouter.put("/:id", updateCropCycle);
cropCycleRouter.delete("/:id", deleteCropCycle);

