import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";

// Sowing months are when the crop can be planted: 1 = January … 12 = December.
// A window may wrap past December (11 → 1).
export interface CreateCropInput {
  name: string;
  nameBn?: string;
  sowingStartMonth?: number;
  sowingEndMonth?: number;
  growthDays?: number;
  durationDays?: number;
  soilTypes?: string;
  idealSoil?: string;
  category?: string;
  optimalTemp?: number;
  optimalRainfall?: number;
  description?: string;
  descriptionBn?: string;
}

// `null` clears an optional field; a missing key leaves it unchanged
export interface UpdateCropInput {
  name?: string;
  nameBn?: string | null;
  sowingStartMonth?: number | null;
  sowingEndMonth?: number | null;
  growthDays?: number | null;
  durationDays?: number | null;
  soilTypes?: string | null;
  idealSoil?: string | null;
  category?: string | null;
  optimalTemp?: number | null;
  optimalRainfall?: number | null;
  description?: string | null;
  descriptionBn?: string | null;
}

export const isMonth = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 12;

// Both months are set together or cleared together, so a window always has a start and an end
function checkSowingMonths(start: unknown, end: unknown) {
  const bothEmpty = start == null && end == null;
  if (!bothEmpty && !(isMonth(start) && isMonth(end))) {
    throw AppError.unprocessable("sowingStartMonth and sowingEndMonth must both be months from 1 to 12");
  }
}

export type MonthRange = { from: number; to: number };

// Every month from `start` to `end`, walking past December when needed: (11, 1) → [11, 12, 1]
function monthsBetween(start: number, end: number) {
  const months = [start];
  for (let month = start; month !== end; months.push(month)) {
    month = (month % 12) + 1;
  }
  return months;
}

export const createCrop = serviceHandler(async (data: CreateCropInput) => {
  checkSowingMonths(data.sowingStartMonth, data.sowingEndMonth);

  const days = data.growthDays ?? data.durationDays;
  return await prisma.crop.create({
    data: {
      name: data.name,
      nameBn: data.nameBn,
      sowingStartMonth: data.sowingStartMonth,
      sowingEndMonth: data.sowingEndMonth,
      durationDays: days,
      idealSoil: data.idealSoil ?? data.soilTypes,
      category: data.category,
      optimalTemp: data.optimalTemp,
      optimalRainfall: data.optimalRainfall,
      description: data.description,
      descriptionBn: data.descriptionBn,
    },
  });
});

// `range` keeps only crops that can be planted at some point in those months
export const getAllCrops = serviceHandler(async (search?: string, range?: MonthRange) => {
  const crops = await prisma.crop.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { nameBn: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { name: "asc" },
  });

  // The catalog is small, and windows that wrap past December are easier to compare here than in a query
  if (!range) return crops;
  const wantedMonths = monthsBetween(range.from, range.to);
  return crops.filter(
    ({ sowingStartMonth: start, sowingEndMonth: end }) =>
      start !== null && end !== null && monthsBetween(start, end).some((month) => wantedMonths.includes(month)),
  );
});

export const getCropById = serviceHandler(async (id: string) => {
  return await prisma.crop.findUnique({
    where: { id },
  });
});

export const updateCrop = serviceHandler(async (id: string, data: UpdateCropInput) => {
  const changesSowing = data.sowingStartMonth !== undefined || data.sowingEndMonth !== undefined;
  if (changesSowing) {
    checkSowingMonths(data.sowingStartMonth, data.sowingEndMonth);
  }

  // The aliases (growthDays, soilTypes) win when sent, same as on create
  const days = data.growthDays !== undefined ? data.growthDays : data.durationDays;
  const soil = data.idealSoil !== undefined ? data.idealSoil : data.soilTypes;
  return await prisma.crop.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.nameBn !== undefined ? { nameBn: data.nameBn } : {}),
      ...(changesSowing
        ? { sowingStartMonth: data.sowingStartMonth ?? null, sowingEndMonth: data.sowingEndMonth ?? null }
        : {}),
      ...(days !== undefined ? { durationDays: days } : {}),
      ...(soil !== undefined ? { idealSoil: soil } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.optimalTemp !== undefined ? { optimalTemp: data.optimalTemp } : {}),
      ...(data.optimalRainfall !== undefined ? { optimalRainfall: data.optimalRainfall } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.descriptionBn !== undefined ? { descriptionBn: data.descriptionBn } : {}),
    },
  });
});

export const deleteCrop = serviceHandler(async (id: string) => {
  // Prices, crop cycles and questions point at the crop, so it can't go while they exist
  const crop = await prisma.crop.findUnique({
    where: { id },
    select: { _count: { select: { cropCycles: true, questions: true, marketPrices: true } } },
  });
  if (!crop) {
    throw AppError.notFound("Crop not found");
  }

  const { cropCycles, questions, marketPrices } = crop._count;
  if (cropCycles + questions + marketPrices > 0) {
    throw AppError.conflict("Crop is in use and cannot be deleted");
  }

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
