import { Router } from "express";
import {
  createNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
} from "./notification.controller.js";

export const notificationRouter = Router();

notificationRouter.post("/", createNotification);
notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read-all", markAllAsRead);
notificationRouter.patch("/:id/read", markAsRead);
notificationRouter.delete("/:id", deleteNotification);
