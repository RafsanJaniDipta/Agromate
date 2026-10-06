import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateFarmInput {
  name: string;
  location: string;
  totalArea?: number;
  areaInAcres?: number;
  soilType?: string;
  userId: string;
}

export interface UpdateFarmInput {
  name?: string;
  location?: string;
  totalArea?: number;
  areaInAcres?: number;
  soilType?: string;
}

export const createFarm = serviceHandler(async (data: CreateFarmInput) => {
  const area = data.totalArea ?? data.areaInAcres ?? 0;
  return await prisma.farm.create({
    data: {
      name: data.name,
      location: data.location,
      areaInAcres: area,
      soilType: data.soilType,
      userId: data.userId,
    },
  });
});

export const getFarmsByUserId = serviceHandler(async (userId: string) => {
  return await prisma.farm.findMany({
    where: { userId },
    include: {
      fields: true,
    },
    orderBy: { createdAt: "desc" },
  });
});

export const getFarmById = serviceHandler(async (id: string, userId: string) => {
  return await prisma.farm.findFirst({
    where: { id, userId },
    include: {
      fields: true,
    },
  });
});

export const updateFarm = serviceHandler(async (id: string, userId: string, data: UpdateFarmInput) => {
  const farm = await prisma.farm.findFirst({ where: { id, userId } });
  if (!farm) return null;

  const area = data.totalArea ?? data.areaInAcres;

  return await prisma.farm.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(area !== undefined ? { areaInAcres: area } : {}),
      ...(data.soilType !== undefined ? { soilType: data.soilType } : {}),
    },
    include: { fields: true },
  });
});

export const deleteFarm = serviceHandler(async (id: string, userId: string) => {
  const farm = await prisma.farm.findFirst({ where: { id, userId } });
  if (!farm) return false;

  await prisma.farm.delete({ where: { id } });
  return true;
});

export const FarmService = {
  createFarm,
  getFarmsByUserId,
  getFarmById,
  updateFarm,
  deleteFarm,
};
