import { prisma } from "../../config/database.js";

export interface CreateCropInput {
  name: string;
  category?: string;
  idealSoil?: string;
  optimalTemp?: number;
  optimalRainfall?: number;
  durationDays?: number;
  description?: string;
}

export interface UpdateCropInput {
  name?: string;
  category?: string;
  idealSoil?: string;
  optimalTemp?: number;
  optimalRainfall?: number;
  durationDays?: number;
  description?: string;
}

export class CropService {
  static async createCrop(data: CreateCropInput) {
    return prisma.crop.create({ data });
  }

  static async getAllCrops() {
    return prisma.crop.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async getCropById(id: string) {
    return prisma.crop.findUnique({
      where: { id },
      include: {
        cropCycles: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async updateCrop(id: string, data: UpdateCropInput) {
    return prisma.crop.update({
      where: { id },
      data,
    });
  }

  static async deleteCrop(id: string) {
    return prisma.crop.delete({
      where: { id },
    });
  }
}
