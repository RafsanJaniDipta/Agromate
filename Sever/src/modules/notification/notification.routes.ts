import { Router } from "express";
import { NotificationController } from "./notification.controller.js";

export const notificationRouter = Router();

notificationRouter.post("/", NotificationController.createNotification);
notificationRouter.get("/", NotificationController.getNotifications);
notificationRouter.patch("/read-all", NotificationController.markAllAsRead);
notificationRouter.patch("/:id/read", NotificationController.markAsRead);
notificationRouter.delete("/:id", NotificationController.deleteNotification);
