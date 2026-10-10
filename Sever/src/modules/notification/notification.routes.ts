import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";
import {
  createNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
} from "./notification.controller.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

// Sending to an arbitrary user is an admin action
notificationRouter.post("/", adminOnly, createNotification);
notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read-all", markAllAsRead);
notificationRouter.patch("/:id/read", markAsRead);
notificationRouter.delete("/:id", deleteNotification);
