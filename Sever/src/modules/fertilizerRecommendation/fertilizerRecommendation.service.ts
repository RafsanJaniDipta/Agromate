import { prisma } from "../../config/database.js";

export interface CreateFertilizerRecommendationInput {
  userId: string;
  farmId?: string;
  cropName: string;
  soilN?: number;
  soilP?: number;
  soilK?: number;
  recommendedN: number;
  recommendedP: number;
  recommendedK: number;
  notes?: string;
}

export class FertilizerRecommendationService {
  static async createRecommendation(data: CreateFertilizerRecommendationInput) {
    return prisma.fertilizerRecommendation.create({ data });
  }

  static async getRecommendationsByUserId(userId: string) {
    return prisma.fertilizerRecommendation.findMany({
      where: { userId },
      include: { farm: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getRecommendationById(id: string) {
    return prisma.fertilizerRecommendation.findUnique({
      where: { id },
      include: { farm: true, user: true },
    });
  }

  static async deleteRecommendation(id: string, userId: string) {
    return prisma.fertilizerRecommendation.deleteMany({
      where: { id, userId },
    });
  }
}
