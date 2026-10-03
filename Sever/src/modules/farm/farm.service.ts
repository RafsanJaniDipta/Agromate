import { prisma } from "../../config/database.js";

export interface CreateFarmInput {
  name: string;
  location: string;
  areaInAcres: number;
  soilType?: string;
  userId: string;
}

export interface UpdateFarmInput {
  name?: string;
  location?: string;
  areaInAcres?: number;
  soilType?: string;
}

export class FarmService {
  static async createFarm(data: CreateFarmInput) {
    return prisma.farm.create({
      data,
    });
  }

  static async getFarmsByUserId(userId: string) {
    return prisma.farm.findMany({
      where: { userId },
      include: {
        fields: true,
        _count: {
          select: { expenses: true, fields: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getFarmById(id: string, userId?: string) {
    return prisma.farm.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      include: {
        fields: {
          include: {
            cropCycles: {
              include: { crop: true },
            },
          },
        },
        expenses: true,
      },
    });
  }

  static async updateFarm(id: string, userId: string, data: UpdateFarmInput) {
    return prisma.farm.updateMany({
      where: { id, userId },
      data,
    });
  }

  static async deleteFarm(id: string, userId: string) {
    return prisma.farm.deleteMany({
      where: { id, userId },
    });
  }
}
