import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import type { NotificationType } from "../../generated/prisma/client.js";
import { getIO } from "../../socket/socket.server.js";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  referenceId?: string;
}

export const createNotification = serviceHandler(async (data: CreateNotificationInput) => {
  return prisma.notification.create({ data });
});

/**
 * Creates notification record in DB and dispatches a live Socket.io event to `user_${userId}` room.
 */
export const createAndDispatchNotification = serviceHandler(async (data: CreateNotificationInput) => {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type ?? "INFO",
      referenceId: data.referenceId,
    },
  });

  const io = getIO();
  if (io) {
    io.to(`user_${data.userId}`).emit("new_notification", notification);
  }

  return notification;
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
  createAndDispatchNotification,
  getNotificationsByUserId,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

