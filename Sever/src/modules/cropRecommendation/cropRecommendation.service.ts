import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateCropRecommendationInput {
  userId: string;
  location: string;
  soilType: string;
  season?: string;
  recommendedCrops: string;
}

export const createRecommendation = serviceHandler(async (data: CreateCropRecommendationInput) => {
  return prisma.cropRecommendation.create({ data });
});

export const getRecommendationsByUserId = serviceHandler(async (userId: string) => {
  return prisma.cropRecommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
});

export const getRecommendationById = serviceHandler(async (id: string) => {
  return prisma.cropRecommendation.findUnique({
    where: { id },
    include: { user: true },
  });
});

export const deleteRecommendation = serviceHandler(async (id: string, userId: string) => {
  return prisma.cropRecommendation.deleteMany({
    where: { id, userId },
  });
});

export const CropRecommendationService = {
  createRecommendation,
  getRecommendationsByUserId,
  getRecommendationById,
  deleteRecommendation,
};
