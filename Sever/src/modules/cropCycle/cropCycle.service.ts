import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateCropCycleInput {
  fieldId: string;
  cropId: string;
  plantingDate?: Date | string;
  startDate?: Date | string;
  expectedHarvestDate?: Date | string;
  growthStage?: string;
  notes?: string;
  userId: string;
}

export interface UpdateCropCycleInput {
  status?: any;
  growthStage?: string;
  expectedHarvestDate?: Date | string;
  actualHarvestDate?: Date | string;
  notes?: string;
}

export const createCropCycle = serviceHandler(async (data: CreateCropCycleInput) => {
  const field = await prisma.field.findUnique({
    where: { id: data.fieldId },
    include: { farm: true },
  });

  if (!field || field.farm.userId !== data.userId) {
    return null;
  }

  const pDate = data.plantingDate ?? data.startDate ?? new Date();

  return await prisma.cropCycle.create({
    data: {
      fieldId: data.fieldId,
      cropId: data.cropId,
      plantingDate: new Date(pDate),
      startDate: new Date(pDate),
      expectedHarvestDate: data.expectedHarvestDate ? new Date(data.expectedHarvestDate) : undefined,
      growthStage: data.growthStage ?? "PLANTED",
      status: "PLANNED" as any,
      notes: data.notes,
    },
    include: {
      field: true,
      crop: true,
    },
  });
});

export const getCropCycles = serviceHandler(async (userId: string, fieldId?: string, status?: string) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  return await prisma.cropCycle.findMany({
    where: {
      field: { farmId: { in: farmIds } },
      ...(fieldId ? { fieldId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      field: true,
      crop: true,
    },
    orderBy: { startDate: "desc" },
  });
});

export const getCalendarEvents = serviceHandler(async (userId: string, fromStr?: string, toStr?: string) => {
  const farms = await prisma.farm.findMany({
    where: { userId },
    select: { id: true },
  });
  const farmIds = farms.map((f) => f.id);

  const fromDate = fromStr ? new Date(fromStr) : new Date(0);
  const toDate = toStr ? new Date(toStr) : new Date("2100-01-01");

  const cycles = await prisma.cropCycle.findMany({
    where: {
      field: { farmId: { in: farmIds } },
      OR: [
        { plantingDate: { gte: fromDate, lte: toDate } },
        { startDate: { gte: fromDate, lte: toDate } },
        { expectedHarvestDate: { gte: fromDate, lte: toDate } },
      ],
    },
    include: { crop: true, field: true },
  });

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      dueDate: { gte: fromDate, lte: toDate },
    },
  });

  return {
    cropCycles: cycles,
    reminders,
  };
});

export const getCropCycleById = serviceHandler(async (id: string, userId: string) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id },
    include: {
      field: { include: { farm: true } },
      crop: true,
      expenses: true,
      harvests: true,
    },
  });

  if (!cycle || cycle.field.farm.userId !== userId) {
    return null;
  }

  const totalExpense = cycle.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalHarvestQuantity = cycle.harvests.reduce((sum, h) => sum + (h.quantity || 0), 0);

  return {
    ...cycle,
    totals: {
      totalExpense,
      totalHarvestQuantity,
    },
  };
});

export const updateCropCycle = serviceHandler(async (id: string, userId: string, data: UpdateCropCycleInput) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id },
    include: { field: { include: { farm: true } } },
  });

  if (!cycle || cycle.field.farm.userId !== userId) {
    return null;
  }

  return await prisma.cropCycle.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.growthStage !== undefined ? { growthStage: data.growthStage } : {}),
      ...(data.expectedHarvestDate ? { expectedHarvestDate: new Date(data.expectedHarvestDate) } : {}),
      ...(data.actualHarvestDate ? { actualHarvestDate: new Date(data.actualHarvestDate) } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
    include: {
      field: true,
      crop: true,
    },
  });
});

export const deleteCropCycle = serviceHandler(async (id: string, userId: string) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id },
    include: { field: { include: { farm: true } } },
  });

  if (!cycle || cycle.field.farm.userId !== userId) {
    return false;
  }

  await prisma.cropCycle.delete({ where: { id } });
  return true;
});

export const CropCycleService = {
  createCropCycle,
  getCropCycles,
  getCalendarEvents,
  getCropCycleById,
  updateCropCycle,
  deleteCropCycle,
};


