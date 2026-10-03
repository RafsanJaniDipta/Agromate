import { prisma } from "../../config/database.js";

export interface CreateMarketPriceInput {
  cropName: string;
  pricePerKg?: number;
  pricePerUnit?: number;
  location: string;
  source?: string;
  date?: Date | string;
}

export interface UpdateMarketPriceInput {
  cropName?: string;
  pricePerKg?: number;
  pricePerUnit?: number;
  location?: string;
  source?: string;
  date?: Date | string;
}

const createMarketPrice = async (data: CreateMarketPriceInput) => {
  const price = data.pricePerKg ?? data.pricePerUnit ?? 0;
  return await prisma.marketPrice.create({
    data: {
      cropName: data.cropName,
      location: data.location,
      pricePerUnit: price,
      pricePerKg: price,
      source: data.source,
      date: data.date ? new Date(data.date) : new Date(),
    } as any,
  });
};

const getMarketPrices = async (params: {
  cropName?: string;
  location?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(params.cropName ? { cropName: { contains: params.cropName, mode: "insensitive" } } : {}),
    ...(params.location ? { location: { contains: params.location, mode: "insensitive" } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.marketPrice.count({ where }),
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" },
    }),
  ]);

  return {
    items,
    meta: { page, limit, total },
  };
};

const getTrends = async (cropName: string, days: number = 30) => {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const prices = await prisma.marketPrice.findMany({
    where: {
      cropName: { equals: cropName, mode: "insensitive" },
      date: { gte: fromDate },
    },
    orderBy: { date: "asc" },
  });

  const priceHistory = prices.map((p) => ({
    date: p.date ? new Date(p.date).toISOString().split("T")[0] : "",
    pricePerKg: (p as any).pricePerKg ?? p.pricePerUnit,
  }));

  return {
    cropName,
    priceHistory,
  };
};

const getMarketPriceById = async (id: string) => {
  return await prisma.marketPrice.findUnique({
    where: { id },
  });
};

const updateMarketPrice = async (id: string, data: UpdateMarketPriceInput) => {
  const price = data.pricePerKg ?? data.pricePerUnit;
  return await prisma.marketPrice.update({
    where: { id },
    data: {
      ...(data.cropName !== undefined ? { cropName: data.cropName } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(price !== undefined ? { pricePerUnit: price, pricePerKg: price } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
    } as any,
  });
};

const deleteMarketPrice = async (id: string) => {
  return await prisma.marketPrice.delete({
    where: { id },
  });
};

export const MarketService = {
  createMarketPrice,
  getMarketPrices,
  getTrends,
  getMarketPriceById,
  updateMarketPrice,
  deleteMarketPrice,
};


