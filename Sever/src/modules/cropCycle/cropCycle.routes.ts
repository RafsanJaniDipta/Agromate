import { Router } from "express";
import {
  createCropCycle,
  getCropCycles,
  getCalendarEvents,
  getCropCycleById,
  updateCropCycle,
  deleteCropCycle,
} from "./cropCycle.controller.js";
import {
  getPlanForCycle,
  generateTasksForCycle,
  updateTask,
} from "../cropPlan/cropPlan.controller.js";
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

// Growth plan (milestones + tasks) for a specific crop cycle
cropCycleRouter.get("/:id/plan", getPlanForCycle);
cropCycleRouter.post("/:id/plan", generateTasksForCycle);
cropCycleRouter.patch("/:id/tasks/:taskId", updateTask);

