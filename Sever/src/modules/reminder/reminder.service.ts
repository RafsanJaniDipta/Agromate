import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateReminderInput {
  title: string;
  dueDate: Date | string;
  note?: string;
  cropCycleId?: string;
  userId: string;
}

export interface UpdateReminderInput {
  title?: string;
  dueDate?: Date | string;
  note?: string;
  isDone?: boolean;
  // Older clients send this name for isDone
  isCompleted?: boolean;
}

// A reminder may only point at one of the user's own crop cycles
async function assertOwnCropCycle(cropCycleId: string, userId: string) {
  const cycle = await prisma.cropCycle.findFirst({
    where: { id: cropCycleId, field: { farm: { userId } } },
    select: { id: true },
  });
  if (!cycle) {
    throw AppError.notFound("Crop cycle not found or unauthorized");
  }
}

export const createReminder = serviceHandler(async (data: CreateReminderInput) => {
  if (data.cropCycleId) {
    await assertOwnCropCycle(data.cropCycleId, data.userId);
  }

  return prisma.reminder.create({
    data: {
      title: data.title,
      dueDate: new Date(data.dueDate),
      note: data.note,
      cropCycleId: data.cropCycleId,
      userId: data.userId,
    },
  });
});

export const getReminders = serviceHandler(async (userId: string, cropCycleId?: string, isDone?: boolean) => {
  return prisma.reminder.findMany({
    where: {
      userId,
      ...(cropCycleId ? { cropCycleId } : {}),
      ...(isDone !== undefined ? { isDone } : {}),
    },
    include: {
      cropCycle: { include: { crop: true } },
    },
    orderBy: { dueDate: "asc" },
  });
});

export const updateReminder = serviceHandler(async (id: string, userId: string, data: UpdateReminderInput) => {
  const reminder = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!reminder) return null;

  const isDone = data.isDone ?? data.isCompleted;

  return prisma.reminder.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      ...(data.note !== undefined ? { note: data.note } : {}),
      ...(isDone !== undefined ? { isDone: Boolean(isDone) } : {}),
    },
  });
});

export const deleteReminder = serviceHandler(async (id: string, userId: string) => {
  const reminder = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!reminder) return false;

  await prisma.reminder.delete({ where: { id } });
  return true;
});

export const ReminderService = {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
};
