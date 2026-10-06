import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { parseEnum } from "../../utils/enum.js";
import { CropCycleStatus } from "../../generated/prisma/client.js";
import { addDays, buildTaskInputs, getCropPlan } from "../cropPlan/cropPlan.engine.js";

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
  status?: string;
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

  const crop = await prisma.crop.findUnique({ where: { id: data.cropId } });
  if (!crop) {
    return null;
  }

  const pDate = data.plantingDate ?? data.startDate ?? new Date();

  // Derive the default time frame from the crop's cultivation plan, otherwise
  // from the crop's durationDays field.
  const plan = await getCropPlan(crop.name, crop.id);
  const defaultDurationDays = plan?.durationDays ?? crop.durationDays ?? null;
  const actualDurationDays = defaultDurationDays;

  return await prisma.$transaction(async (tx) => {
    const cycle = await tx.cropCycle.create({
      data: {
        fieldId: data.fieldId,
        cropId: data.cropId,
        plantingDate: new Date(pDate),
        expectedHarvestDate: data.expectedHarvestDate
          ? new Date(data.expectedHarvestDate)
          : actualDurationDays
            ? addDays(new Date(pDate), actualDurationDays)
            : undefined,
        growthStage: data.growthStage,
        status: "PLANNED",
        notes: data.notes,
      },
      include: {
        field: true,
        crop: true,
      },
    });

    // Auto-generate the cultivation task list from the demo dataset.
    if (plan) {
      const actualSpanDays =
        data.expectedHarvestDate && cycle.expectedHarvestDate
          ? Math.max(
              1,
              Math.round(
                (cycle.expectedHarvestDate.getTime() - cycle.plantingDate.getTime()) / 86_400_000,
              ),
            )
          : defaultDurationDays;

      const inputs = buildTaskInputs({
        plan,
        plantingDate: cycle.plantingDate,
        actualDurationDays: actualSpanDays,
      });
      await tx.growthTask.createMany({ data: inputs.map((t) => ({ ...t, cropCycleId: cycle.id })) });
    }

    return cycle;
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
      ...(status ? { status: parseEnum(CropCycleStatus, status, "status") } : {}),
    },
    include: {
      field: true,
      crop: true,
    },
    orderBy: { plantingDate: "desc" },
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
      ...(data.status !== undefined ? { status: parseEnum(CropCycleStatus, data.status, "status") } : {}),
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


