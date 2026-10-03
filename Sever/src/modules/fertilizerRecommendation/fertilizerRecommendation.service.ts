import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

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

export const createRecommendation = serviceHandler(async (data: CreateFertilizerRecommendationInput) => {
  return prisma.fertilizerRecommendation.create({ data });
});

export const getRecommendationsByUserId = serviceHandler(async (userId: string) => {
  return prisma.fertilizerRecommendation.findMany({
    where: { userId },
    include: { farm: true },
    orderBy: { createdAt: "desc" },
  });
});

export const getRecommendationById = serviceHandler(async (id: string) => {
  return prisma.fertilizerRecommendation.findUnique({
    where: { id },
    include: { farm: true, user: true },
  });
});

export const deleteRecommendation = serviceHandler(async (id: string, userId: string) => {
  return prisma.fertilizerRecommendation.deleteMany({
    where: { id, userId },
  });
});

export const FertilizerRecommendationService = {
  createRecommendation,
  getRecommendationsByUserId,
  getRecommendationById,
  deleteRecommendation,
};
