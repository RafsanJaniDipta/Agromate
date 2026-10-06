import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getPlanForCycle as getPlanForCycleService,
  generateTasksForCycle as generateTasksForCycleService,
  updateTaskStatus as updateTaskStatusService,
  getCropPlanTemplate as getCropPlanTemplateService,
} from "./cropPlan.service.js";

function requireUser(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }
  return userId;
}

export const getPlanForCycle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUser(req);
  const cycleId = String(req.params.id || "");
  const plan = await getPlanForCycleService(cycleId, userId);
  if (!plan) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }
  sendSuccess(res, 200, "Crop growth plan fetched successfully", plan);
});

export const generateTasksForCycle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUser(req);
  const cycleId = String(req.params.id || "");
  const plan = await generateTasksForCycleService(cycleId, userId);
  if (!plan) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }
  sendSuccess(res, 200, "Crop growth plan generated successfully", plan);
});

export const updateTask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUser(req);
  const cycleId = String(req.params.id || "");
  const taskId = String(req.params.taskId || "");
  const isDone = Boolean(req.body?.isDone);

  const task = await updateTaskStatusService(cycleId, taskId, userId, isDone);
  if (!task) {
    throw AppError.notFound("Task not found or unauthorized");
  }
  sendSuccess(res, 200, isDone ? "Task marked as done" : "Task reopened", task);
});

export const getCropPlanTemplate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cropId = String(req.params.id || "");
  const plantingDate = typeof req.query.plantingDate === "string" ? req.query.plantingDate : undefined;

  const template = await getCropPlanTemplateService(cropId, plantingDate);
  if (!template) {
    throw AppError.notFound("Crop not found or no cultivation plan exists for it yet");
  }
  sendSuccess(res, 200, "Crop cultivation plan fetched successfully", template);
});

export const CropPlanController = {
  getPlanForCycle,
  generateTasksForCycle,
  updateTask,
  getCropPlanTemplate,
};