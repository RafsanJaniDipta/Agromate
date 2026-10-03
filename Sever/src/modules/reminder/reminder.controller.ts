import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createReminder as createReminderService,
  getReminders as getRemindersService,
  updateReminder as updateReminderService,
  deleteReminder as deleteReminderService,
} from "./reminder.service.js";

export const createReminder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { title, dueDate, cropCycleId } = req.body;
  if (!title || !dueDate) {
    throw AppError.unprocessable("Title and dueDate are required");
  }

  const reminder = await createReminderService({
    title,
    dueDate,
    cropCycleId,
    userId,
  });

  sendSuccess(res, 201, "Reminder created successfully", reminder);
});

export const getReminders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { cropCycleId, isCompleted } = req.query;
  const reminders = await getRemindersService(
    userId,
    typeof cropCycleId === "string" ? cropCycleId : undefined,
    isCompleted !== undefined ? isCompleted === "true" : undefined,
  );

  sendSuccess(res, 200, "Reminders fetched successfully", reminders);
});

export const updateReminder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const updated = await updateReminderService(id, userId, req.body);
  if (!updated) {
    throw AppError.notFound("Reminder not found or unauthorized");
  }

  sendSuccess(res, 200, "Reminder updated successfully", updated);
});

export const deleteReminder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteReminderService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Reminder not found or unauthorized");
  }

  sendSuccess(res, 200, "Reminder deleted successfully", { message: "Reminder deleted successfully" });
});

export const ReminderController = {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
};
