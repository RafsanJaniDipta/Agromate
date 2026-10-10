import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createNotification as createNotificationService,
  getNotificationsByUserId as getNotificationsByUserIdService,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService,
} from "./notification.service.js";
import type { NotificationType } from "../../generated/prisma/client.js";

export const createNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, title, message, type } = req.body;
  if (!userId || !title || !message) {
    throw AppError.unprocessable("userId, title, and message are required");
  }

  const notification = await createNotificationService({
    userId,
    title,
    message,
    type: type as NotificationType,
  });

  sendSuccess(res, 201, "Notification created successfully", notification);
});

export const getNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const notifications = await getNotificationsByUserIdService(userId);
  sendSuccess(res, 200, "Notifications fetched successfully", notifications);
});

export const markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const userId = req.user!.id;
  await markAsReadService(id, userId);
  sendSuccess(res, 200, "Notification marked as read", { id });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  await markAllAsReadService(userId);
  sendSuccess(res, 200, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const userId = req.user!.id;
  await deleteNotificationService(id, userId);
  sendSuccess(res, 200, "Notification deleted successfully", { id });
});

export const NotificationController = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
