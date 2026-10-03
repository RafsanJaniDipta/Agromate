import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateFieldInput {
  farmId: string;
  name: string;
  area?: number;
  areaInAcres?: number;
  soilType?: string;
  userId: string;
}

export interface UpdateFieldInput {
  name?: string;
  area?: number;
  areaInAcres?: number;
  soilType?: string;
}

export const createField = serviceHandler(async (data: CreateFieldInput) => {
  const farm = await prisma.farm.findFirst({
    where: { id: data.farmId, userId: data.userId },
  });
  if (!farm) return null;

  const areaVal = data.area ?? data.areaInAcres ?? 0;

  return await prisma.field.create({
    data: {
      farmId: data.farmId,
      name: data.name,
      area: areaVal,
      areaInAcres: areaVal,
      soilType: data.soilType,
    },
  });
});

export const getFieldsByFarmId = serviceHandler(async (farmId: string, userId: string) => {
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId },
  });
  if (!farm) return null;

  return await prisma.field.findMany({
    where: { farmId },
    orderBy: { createdAt: "desc" },
  });
});

export const getFieldById = serviceHandler(async (id: string, userId: string) => {
  const field = await prisma.field.findUnique({
    where: { id },
    include: {
      farm: true,
      cropCycles: {
        include: { crop: true },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!field || field.farm.userId !== userId) {
    return null;
  }

  return field;
});

export const updateField = serviceHandler(async (id: string, userId: string, data: UpdateFieldInput) => {
  const field = await prisma.field.findUnique({
    where: { id },
    include: { farm: true },
  });

  if (!field || field.farm.userId !== userId) {
    return null;
  }

  const areaVal = data.area ?? data.areaInAcres;

  return await prisma.field.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(areaVal !== undefined ? { area: areaVal, areaInAcres: areaVal } : {}),
      ...(data.soilType !== undefined ? { soilType: data.soilType } : {}),
    },
  });
});

export const deleteField = serviceHandler(async (id: string, userId: string) => {
  const field = await prisma.field.findUnique({
    where: { id },
    include: { farm: true },
  });

  if (!field || field.farm.userId !== userId) {
    return false;
  }

  await prisma.field.delete({ where: { id } });
  return true;
});

export const FieldService = {
  createField,
  getFieldsByFarmId,
  getFieldById,
  updateField,
  deleteField,
};
