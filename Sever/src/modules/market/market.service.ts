import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * A price row points at a crop (cropId) and a district. Clients may name the crop
 * instead of sending its id, and older clients send `location` for district and
 * `pricePerKg` for pricePerUnit; all of these are accepted.
 */
export interface MarketPriceInput {
  cropId?: string;
  cropName?: string;
  district?: string;
  location?: string;
  pricePerUnit?: number;
  pricePerKg?: number;
  unit?: string;
  source?: string;
  date?: Date | string;
}

const withCrop = { crop: { select: { id: true, name: true, nameBn: true } } } as const;

// Matches a crop by English or Bangla name, ignoring case
const cropNameFilter = (name: string): Prisma.CropWhereInput => ({
  OR: [
    { name: { equals: name, mode: "insensitive" } },
    { nameBn: { equals: name, mode: "insensitive" } },
  ],
});

async function resolveCropId(input: MarketPriceInput): Promise<string> {
  if (input.cropId) return input.cropId;

  const crop = input.cropName
    ? await prisma.crop.findFirst({ where: cropNameFilter(input.cropName), select: { id: true } })
    : null;
  if (!crop) {
    throw AppError.unprocessable("Unknown crop. Send a valid cropId or cropName.");
  }
  return crop.id;
}

export const createMarketPrice = serviceHandler(async (data: MarketPriceInput) => {
  return await prisma.marketPrice.create({
    data: {
      cropId: await resolveCropId(data),
      district: data.district ?? data.location ?? "General",
      pricePerUnit: Number(data.pricePerUnit ?? data.pricePerKg),
      unit: data.unit?.toUpperCase() ?? "KG",
      source: data.source,
      date: data.date ? new Date(data.date) : new Date(),
    },
    include: withCrop,
  });
});

export const getMarketPrices = serviceHandler(async (params: {
  cropName?: string;
  district?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const where: Prisma.MarketPriceWhereInput = {
    ...(params.cropName
      ? {
          crop: {
            OR: [
              { name: { contains: params.cropName, mode: "insensitive" } },
              { nameBn: { contains: params.cropName, mode: "insensitive" } },
            ],
          },
        }
      : {}),
    ...(params.district ? { district: { contains: params.district, mode: "insensitive" } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.marketPrice.count({ where }),
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
      include: withCrop,
    }),
  ]);

  return {
    items,
    meta: { page, limit, total },
  };
});

export const getTrends = serviceHandler(async (cropName: string, days: number = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const prices = await prisma.marketPrice.findMany({
    where: {
      crop: cropNameFilter(cropName),
      date: { gte: fromDate },
    },
    orderBy: { date: "asc" },
  });

  const priceHistory = prices.map((p) => ({
    date: p.date.toISOString().split("T")[0],
    district: p.district,
    pricePerUnit: p.pricePerUnit,
    unit: p.unit,
  }));

  return {
    cropName,
    priceHistory,
  };
});

export const getMarketPriceById = serviceHandler(async (id: string) => {
  return await prisma.marketPrice.findUnique({
    where: { id },
    include: withCrop,
  });
});

export const updateMarketPrice = serviceHandler(async (id: string, data: MarketPriceInput) => {
  const price = data.pricePerUnit ?? data.pricePerKg;
  const district = data.district ?? data.location;

  return await prisma.marketPrice.update({
    where: { id },
    data: {
      ...(data.cropId || data.cropName ? { cropId: await resolveCropId(data) } : {}),
      ...(district !== undefined ? { district } : {}),
      ...(price !== undefined ? { pricePerUnit: Number(price) } : {}),
      ...(data.unit !== undefined ? { unit: data.unit.toUpperCase() } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
    },
    include: withCrop,
  });
});

export const deleteMarketPrice = serviceHandler(async (id: string) => {
  return await prisma.marketPrice.delete({
    where: { id },
  });
});

export const MarketService = {
  createMarketPrice,
  getMarketPrices,
  getTrends,
  getMarketPriceById,
  updateMarketPrice,
  deleteMarketPrice,
};
