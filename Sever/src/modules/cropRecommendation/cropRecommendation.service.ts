import { prisma } from "../../config/database.js";

export interface CreateCropRecommendationInput {
  userId: string;
  location: string;
  soilType: string;
  season?: string;
  recommendedCrops: string;
}

export class CropRecommendationService {
  static async createRecommendation(data: CreateCropRecommendationInput) {
    return prisma.cropRecommendation.create({ data });
  }

  static async getRecommendationsByUserId(userId: string) {
    return prisma.cropRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getRecommendationById(id: string) {
    return prisma.cropRecommendation.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  static async deleteRecommendation(id: string, userId: string) {
    return prisma.cropRecommendation.deleteMany({
      where: { id, userId },
    });
  }
}
