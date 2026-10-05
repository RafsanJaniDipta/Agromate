import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import type { Prisma } from "../../generated/prisma/client.js";

export interface CreateHarvestInput {
  cropCycleId: string;
  harvestDate?: Date | string;
  quantity: number;
  unit?: string;
  // Sale price per unit; revenue is quantity × pricePerUnit
  pricePerUnit: number;
  userId: string;
}

export interface UpdateHarvestInput {
  harvestDate?: Date | string;
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
}

export const createHarvest = serviceHandler(async (data: CreateHarvestInput) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id: data.cropCycleId },
    include: { field: { include: { farm: true } } },
  });

  if (!cycle || cycle.field.farm.userId !== data.userId) {
    return null;
  }

  return await prisma.harvest.create({
    data: {
      cropCycleId: data.cropCycleId,
      harvestDate: data.harvestDate ? new Date(data.harvestDate) : new Date(),
      quantity: data.quantity,
      unit: data.unit?.toUpperCase() ?? "KG",
      pricePerUnit: data.pricePerUnit,
    },
    include: {
      cropCycle: {
        include: { crop: true, field: true },
      },
    },
  });
});

export const getHarvests = serviceHandler(async (
  userId: string,
  params: {
    cropCycleId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  },
) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const farms = await prisma.farm.findMany({ where: { userId }, select: { id: true } });
  const farmIds = farms.map((f) => f.id);

  const where: Prisma.HarvestWhereInput = {
    cropCycle: { field: { farmId: { in: farmIds } } },
    ...(params.cropCycleId ? { cropCycleId: params.cropCycleId } : {}),
    ...(params.from || params.to
      ? {
          harvestDate: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
          },
        }
      : {}),
  };

  const [total, items, aggregate] = await Promise.all([
    prisma.harvest.count({ where }),
    prisma.harvest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { harvestDate: "desc" },
      include: {
        cropCycle: { include: { crop: true } },
      },
    }),
    prisma.harvest.aggregate({
      where,
      _sum: { quantity: true },
    }),
  ]);

  return {
    items,
    meta: { page, limit, total },
    summary: {
      totalQuantity: aggregate._sum.quantity || 0,
    },
  };
});

export const getHarvestById = serviceHandler(async (id: string, userId: string) => {
  const harvest = await prisma.harvest.findUnique({
    where: { id },
    include: {
      cropCycle: {
        include: { crop: true, field: { include: { farm: true } } },
      },
    },
  });

  if (!harvest || harvest.cropCycle.field.farm.userId !== userId) {
    return null;
  }

  return harvest;
});

export const updateHarvest = serviceHandler(async (id: string, userId: string, data: UpdateHarvestInput) => {
  const harvest = await prisma.harvest.findUnique({
    where: { id },
    include: { cropCycle: { include: { field: { include: { farm: true } } } } },
  });

  if (!harvest || harvest.cropCycle.field.farm.userId !== userId) {
    return null;
  }

  return await prisma.harvest.update({
    where: { id },
    data: {
      ...(data.harvestDate ? { harvestDate: new Date(data.harvestDate) } : {}),
      ...(data.quantity !== undefined ? { quantity: Number(data.quantity) } : {}),
      ...(data.unit !== undefined ? { unit: data.unit.toUpperCase() } : {}),
      ...(data.pricePerUnit !== undefined ? { pricePerUnit: Number(data.pricePerUnit) } : {}),
    },
    include: {
      cropCycle: { include: { crop: true, field: true } },
    },
  });
});

export const deleteHarvest = serviceHandler(async (id: string, userId: string) => {
  const harvest = await prisma.harvest.findUnique({
    where: { id },
    include: { cropCycle: { include: { field: { include: { farm: true } } } } },
  });

  if (!harvest || harvest.cropCycle.field.farm.userId !== userId) {
    return false;
  }

  await prisma.harvest.delete({ where: { id } });
  return true;
});

export const HarvestService = {
  createHarvest,
  getHarvests,
  getHarvestById,
  updateHarvest,
  deleteHarvest,
};
