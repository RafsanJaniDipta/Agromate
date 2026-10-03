import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import type { NotificationType } from "../../generated/prisma/client.js";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}

export const createNotification = serviceHandler(async (data: CreateNotificationInput) => {
  return prisma.notification.create({ data });
});

export const getNotificationsByUserId = serviceHandler(async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
});

export const markAsRead = serviceHandler(async (id: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
});

export const markAllAsRead = serviceHandler(async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
});

export const deleteNotification = serviceHandler(async (id: string, userId: string) => {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
});

export const NotificationService = {
  createNotification,
  getNotificationsByUserId,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
