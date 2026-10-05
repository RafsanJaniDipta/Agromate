import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateCropInput {
  name: string;
  season?: string;
  growthDays?: number;
  durationDays?: number;
  soilTypes?: string;
  idealSoil?: string;
  category?: string;
  optimalTemp?: number;
  optimalRainfall?: number;
  description?: string;
}

export interface UpdateCropInput {
  name?: string;
  season?: string;
  growthDays?: number;
  durationDays?: number;
  soilTypes?: string;
  idealSoil?: string;
  category?: string;
  optimalTemp?: number;
  optimalRainfall?: number;
  description?: string;
}

export const createCrop = serviceHandler(async (data: CreateCropInput) => {
  const days = data.growthDays ?? data.durationDays;
  return await prisma.crop.create({
    data: {
      name: data.name,
      season: data.season,
      durationDays: days,
      idealSoil: data.idealSoil ?? data.soilTypes,
      category: data.category,
      optimalTemp: data.optimalTemp,
      optimalRainfall: data.optimalRainfall,
      description: data.description,
    },
  });
});

export const getAllCrops = serviceHandler(async (search?: string, season?: string) => {
  return await prisma.crop.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(season ? { season: { contains: season, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });
});

export const getCropById = serviceHandler(async (id: string) => {
  return await prisma.crop.findUnique({
    where: { id },
  });
});

export const updateCrop = serviceHandler(async (id: string, data: UpdateCropInput) => {
  const days = data.growthDays ?? data.durationDays;
  return await prisma.crop.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.season !== undefined ? { season: data.season } : {}),
      ...(days !== undefined ? { durationDays: days } : {}),
      ...(data.soilTypes !== undefined ? { idealSoil: data.soilTypes } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.optimalTemp !== undefined ? { optimalTemp: data.optimalTemp } : {}),
      ...(data.optimalRainfall !== undefined ? { optimalRainfall: data.optimalRainfall } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });
});

export const deleteCrop = serviceHandler(async (id: string) => {
  await prisma.crop.delete({
    where: { id },
  });
  return true;
});

export const CropService = {
  createCrop,
  getAllCrops,
  getCropById,
  updateCrop,
  deleteCrop,
};
