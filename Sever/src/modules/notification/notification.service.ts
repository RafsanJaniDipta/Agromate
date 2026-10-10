import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import type { NotificationType } from "../../generated/prisma/client.js";
import { emitToUser } from "../../socket/socket.server.js";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  referenceId?: string;
  // Page to open on click, without the locale
  link?: string;
}

// Saves a notification and pushes it to the user's open dashboards, so the bell updates live
export const createNotification = serviceHandler(async (data: CreateNotificationInput) => {
  const notification = await prisma.notification.create({
    data: { ...data, type: data.type ?? "INFO" },
  });
  emitToUser(data.userId, "notification:new", notification);
  return notification;
});

// Older name, kept for the modules that already call it
export const createAndDispatchNotification = createNotification;

// One unread notification per subject (e.g. a chat): while it's unread, a newer event
// refreshes it and moves it to the top instead of adding another, so the bell isn't flooded
export const notifyLatest = serviceHandler(
  async (data: CreateNotificationInput & { referenceId: string }) => {
    const unread = await prisma.notification.findFirst({
      where: { userId: data.userId, referenceId: data.referenceId, isRead: false },
      select: { id: true },
    });
    if (!unread) return createNotification(data);

    const notification = await prisma.notification.update({
      where: { id: unread.id },
      data: { title: data.title, message: data.message, link: data.link, createdAt: new Date() },
    });
    emitToUser(data.userId, "notification:new", notification);
    return notification;
  },
);

// Marks a subject's notifications read (e.g. once the chat is opened) and tells the open bells
export const markReadByReference = serviceHandler(async (userId: string, referenceId: string) => {
  const { count } = await prisma.notification.updateMany({
    where: { userId, referenceId, isRead: false },
    data: { isRead: true },
  });
  if (count > 0) emitToUser(userId, "notification:read", { referenceId });
  return count;
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

