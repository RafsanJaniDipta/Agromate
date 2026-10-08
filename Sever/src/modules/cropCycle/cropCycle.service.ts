import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { parseEnum } from "../../utils/enum.js";
import { AppError } from "../../utils/AppError.js";
import { CropCycleStatus } from "../../generated/prisma/client.js";
import { addDays, buildTaskInputs, getCropPlan } from "../cropPlan/cropPlan.engine.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Turns a client-sent date into a Date; a bad value becomes a 422 instead of a database error
function parseDate(value: Date | string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw AppError.unprocessable(`Invalid ${field}`);
  }
  return date;
}

// Like parseDate, but keeps `undefined` (leave unchanged) and `null` (clear) as they are
function parseOptionalDate(value: Date | string | null | undefined, field: string) {
  return value === undefined || value === null ? value : parseDate(value, field);
}

export interface CreateCropCycleInput {
  fieldId: string;
  cropId: string;
  plantingDate?: Date | string;
  startDate?: Date | string;
  expectedHarvestDate?: Date | string;
  // Defaults to PLANNED; a crop already in the ground can start as PLANTED or GROWING
  status?: string;
  growthStage?: string;
  notes?: string;
  userId: string;
}

// `null` clears a date or the notes; a missing key leaves it unchanged
export interface UpdateCropCycleInput {
  status?: string;
  growthStage?: string;
  plantingDate?: Date | string;
  expectedHarvestDate?: Date | string | null;
  actualHarvestDate?: Date | string | null;
  notes?: string | null;
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
    throw AppError.notFound("Crop not found");
  }

  const plantingDate = parseDate(data.plantingDate ?? data.startDate ?? new Date(), "plantingDate");
  // Without a date from the farmer, the harvest is expected once the crop's growing days have passed
  const expectedHarvestDate = data.expectedHarvestDate
    ? parseDate(data.expectedHarvestDate, "expectedHarvestDate")
    : crop.durationDays
      ? new Date(plantingDate.getTime() + crop.durationDays * DAY_MS)
      : undefined;

  return await prisma.cropCycle.create({
    data: {
      fieldId: data.fieldId,
      cropId: data.cropId,
      plantingDate,
      expectedHarvestDate,
      growthStage: data.growthStage,
      status: data.status ? parseEnum(CropCycleStatus, data.status, "status") : "PLANNED",
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

  const status = data.status !== undefined ? parseEnum(CropCycleStatus, data.status, "status") : undefined;
  let actualHarvestDate = parseOptionalDate(data.actualHarvestDate, "actualHarvestDate");
  // Marking a crop harvested without a date records today as the harvest day
  if (status === "HARVESTED" && actualHarvestDate === undefined && !cycle.actualHarvestDate) {
    actualHarvestDate = new Date();
  }

  return await prisma.cropCycle.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(data.growthStage !== undefined ? { growthStage: data.growthStage } : {}),
      ...(data.plantingDate !== undefined ? { plantingDate: parseDate(data.plantingDate, "plantingDate") } : {}),
      ...(data.expectedHarvestDate !== undefined
        ? { expectedHarvestDate: parseOptionalDate(data.expectedHarvestDate, "expectedHarvestDate") }
        : {}),
      ...(actualHarvestDate !== undefined ? { actualHarvestDate } : {}),
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


