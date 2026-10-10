import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { parseFieldBoundary } from "../../utils/fieldBoundary.js";
import { Prisma } from "../../generated/prisma/client.js";

export interface CreateFieldInput {
  farmId: string;
  name: string;
  area?: number;
  areaInAcres?: number;
  soilType?: string;
  // GeoJSON Polygon drawn on the map; checked by parseFieldBoundary
  boundary?: unknown;
  userId: string;
}

export interface UpdateFieldInput {
  name?: string;
  area?: number;
  areaInAcres?: number;
  soilType?: string;
  // `null` removes the outline
  boundary?: unknown;
}

// Prisma stores "no outline" as a database NULL, which needs its own marker for JSON columns
const toBoundaryColumn = (boundary: ReturnType<typeof parseFieldBoundary>) =>
  boundary === null ? Prisma.DbNull : boundary;

export const createField = serviceHandler(async (data: CreateFieldInput) => {
  const boundary = parseFieldBoundary(data.boundary);
  const farm = await prisma.farm.findFirst({
    where: { id: data.farmId, userId: data.userId },
  });
  if (!farm) return null;

  const areaVal = data.area ?? data.areaInAcres ?? 0;

  return await prisma.field.create({
    data: {
      farmId: data.farmId,
      name: data.name,
      areaInAcres: areaVal,
      soilType: data.soilType,
      ...(boundary ? { boundary } : {}),
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
        orderBy: { plantingDate: "desc" },
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
  const boundary = parseFieldBoundary(data.boundary);

  return await prisma.field.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(areaVal !== undefined ? { areaInAcres: areaVal } : {}),
      ...(data.soilType !== undefined ? { soilType: data.soilType } : {}),
      ...(boundary !== undefined ? { boundary: toBoundaryColumn(boundary) } : {}),
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
