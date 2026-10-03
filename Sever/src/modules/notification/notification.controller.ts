import type { Request, Response } from "express";
import { NotificationService } from "./notification.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { NotificationType } from "../../generated/prisma/index.js";

const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !title || !message) {
      sendError(res, 400, "userId, title, and message are required");
      return;
    }

    const notification = await NotificationService.createNotification({
      userId,
      title,
      message,
      type: type as NotificationType,
    });

    sendSuccess(res, 201, "Notification created successfully", notification);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to create notification");
  }
};

const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 400, "userId is required");
      return;
    }

    const notifications = await NotificationService.getNotificationsByUserId(userId);
    sendSuccess(res, 200, "Notifications fetched successfully", notifications);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch notifications");
  }
};

const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    await NotificationService.markAsRead(id, userId);
    sendSuccess(res, 200, "Notification marked as read", { id });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to mark notification as read");
  }
};

const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    await NotificationService.markAllAsRead(userId);
    sendSuccess(res, 200, "All notifications marked as read");
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to mark all notifications as read");
  }
};

const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    await NotificationService.deleteNotification(id, userId);
    sendSuccess(res, 200, "Notification deleted successfully", { id });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete notification");
  }
};

export const NotificationController = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

