import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateReminderInput {
  title: string;
  dueDate: Date | string;
  cropCycleId?: string;
  userId: string;
}

export interface UpdateReminderInput {
  title?: string;
  dueDate?: Date | string;
  isCompleted?: boolean;
}

export const createReminder = serviceHandler(async (data: CreateReminderInput) => {
  return (prisma as any).reminder.create({
    data: {
      title: data.title,
      dueDate: new Date(data.dueDate),
      cropCycleId: data.cropCycleId,
      userId: data.userId,
      isCompleted: false,
    },
  });
});

export const getReminders = serviceHandler(async (userId: string, cropCycleId?: string, isCompleted?: boolean) => {
  return (prisma as any).reminder.findMany({
    where: {
      userId,
      ...(cropCycleId ? { cropCycleId } : {}),
      ...(isCompleted !== undefined ? { isCompleted } : {}),
    },
    include: {
      cropCycle: true,
    },
    orderBy: { dueDate: "asc" },
  });
});

export const updateReminder = serviceHandler(async (id: string, userId: string, data: UpdateReminderInput) => {
  const reminder = await (prisma as any).reminder.findFirst({
    where: { id, userId },
  });
  if (!reminder) return null;

  return (prisma as any).reminder.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      ...(data.isCompleted !== undefined ? { isCompleted: data.isCompleted } : {}),
    },
  });
});

export const deleteReminder = serviceHandler(async (id: string, userId: string) => {
  const reminder = await (prisma as any).reminder.findFirst({
    where: { id, userId },
  });
  if (!reminder) return false;

  await (prisma as any).reminder.delete({ where: { id } });
  return true;
});

export const ReminderService = {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
};
