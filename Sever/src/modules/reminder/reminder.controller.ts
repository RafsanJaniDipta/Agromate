import type { Request, Response } from "express";
import { ReminderService } from "./reminder.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { title, dueDate, cropCycleId } = req.body;
    if (!title || !dueDate) {
      sendError(res, 422, "Title and dueDate are required");
      return;
    }

    const reminder = await ReminderService.createReminder({
      title,
      dueDate,
      cropCycleId,
      userId,
    });

    sendSuccess(res, 201, "Reminder created successfully", reminder);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create reminder");
  }
};

const getReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { cropCycleId, isCompleted } = req.query;
    const reminders = await ReminderService.getReminders(
      userId,
      typeof cropCycleId === "string" ? cropCycleId : undefined,
      isCompleted !== undefined ? isCompleted === "true" : undefined,
    );

    sendSuccess(res, 200, "Reminders fetched successfully", reminders);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch reminders");
  }
};

const updateReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const updated = await ReminderService.updateReminder(id, userId, req.body);
    if (!updated) {
      sendError(res, 404, "Reminder not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Reminder updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update reminder");
  }
};

const deleteReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await ReminderService.deleteReminder(id, userId);
    if (!deleted) {
      sendError(res, 404, "Reminder not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Reminder deleted successfully", { message: "Reminder deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete reminder");
  }
};

export const ReminderController = {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
};

