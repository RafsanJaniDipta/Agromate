import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { FERTILIZERS, NUTRIENT_SHARE, guideFor, type Dose, type Fertilizer } from "./fertilizer.guide.js";

// How much of each fertilizer a field needs for a crop, in kg and 50 kg bags, with the cost at
// today's fertilizer prices. Doses come from fertilizer.guide.ts (no soil test); the soil's
// fertility nudges them up or down.

const HECTARES_PER_ACRE = 0.4047;
// A bigha in most of Bangladesh is 33 decimals
const ACRES_PER_BIGHA = 0.33;
const BAG_KG = 50;
const MAX_ACRES = 10_000;

export const FERTILITY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type Fertility = (typeof FERTILITY_LEVELS)[number];
// Poorer soil needs more, richer soil less (the guide doses are for medium fertility)
const FERTILITY_FACTOR: Record<Fertility, number> = { LOW: 1.2, MEDIUM: 1, HIGH: 0.8 };

// Price list items for fertilizers that have one
const PRICE_SLUGS: Partial<Record<Fertilizer, string>> = { urea: "urea", tsp: "tsp", mop: "mop" };

type Range = { min: number; max: number };
const toRange = (dose: Dose): Range => (Array.isArray(dose) ? { min: dose[0], max: dose[1] } : { min: dose, max: dose });
const scale = (range: Range, by: number, digits = 1): Range => {
  const round = (value: number) => Math.round(value * 10 ** digits) / 10 ** digits;
  return { min: round(range.min * by), max: round(range.max * by) };
};
const middle = (range: Range) => (range.min + range.max) / 2;

// Today's price per kg of each priced fertilizer (midpoint of the latest official price)
async function fertilizerPrices() {
  const items = await prisma.priceItem.findMany({
    where: { slug: { in: Object.values(PRICE_SLUGS) } },
    select: { slug: true, records: { orderBy: { date: "desc" }, take: 1, select: { minPrice: true, maxPrice: true } } },
  });
  const prices: Partial<Record<Fertilizer, number>> = {};
  for (const [fertilizer, slug] of Object.entries(PRICE_SLUGS) as [Fertilizer, string][]) {
    const record = items.find((item) => item.slug === slug)?.records[0];
    if (record) prices[fertilizer] = (record.minPrice + record.maxPrice) / 2;
  }
  return prices;
}

export type FertilizerInput = { cropId?: unknown; fieldId?: unknown; areaAcres?: unknown; fertility?: unknown };

export const recommendFertilizer = serviceHandler(async (userId: string, input: FertilizerInput) => {
  const crop = typeof input.cropId === "string" ? await prisma.crop.findUnique({ where: { id: input.cropId } }) : null;
  if (!crop) throw AppError.unprocessable("Choose a crop");
  const guide = guideFor(crop.name);
  if (!guide) throw AppError.notFound("There's no fertilizer recommendation for this crop yet");

  // The field's own size, or the area the farmer typed
  const field =
    typeof input.fieldId === "string" && input.fieldId
      ? await prisma.field.findFirst({
          where: { id: input.fieldId, farm: { userId } },
          select: { id: true, name: true, areaInAcres: true, farmId: true },
        })
      : null;
  if (input.fieldId && !field) throw AppError.notFound("Field not found");
  const areaAcres = Number(input.areaAcres) > 0 ? Number(input.areaAcres) : (field?.areaInAcres ?? 0);
  if (!(areaAcres > 0) || areaAcres > MAX_ACRES) throw AppError.unprocessable("Enter the land area in acres");

  const fertility: Fertility = FERTILITY_LEVELS.includes(input.fertility as Fertility)
    ? (input.fertility as Fertility)
    : "MEDIUM";
  const factor = FERTILITY_FACTOR[fertility];
  const hectares = areaAcres * HECTARES_PER_ACRE;
  const prices = await fertilizerPrices();

  const items = FERTILIZERS.flatMap((fertilizer) => {
    const dose = guide.doses[fertilizer];
    if (dose === undefined) return [];
    const perHa = scale(toRange(dose), factor, 0);
    const total = scale(perHa, hectares);
    const pricePerKg = prices[fertilizer] ?? null;
    return [
      {
        fertilizer,
        perHa,
        total,
        perBigha: scale(perHa, ACRES_PER_BIGHA * HECTARES_PER_ACRE),
        bags: scale(total, 1 / BAG_KG),
        pricePerKg,
        cost: pricePerKg === null ? null : scale(total, pricePerKg, 0),
      },
    ];
  });

  const organic = guide.organicTonsPerHa
    ? { perHa: toRange(guide.organicTonsPerHa), total: scale(toRange(guide.organicTonsPerHa), hectares) }
    : null;
  const pricedCosts = items.flatMap((item) => (item.cost ? [item.cost] : []));
  const totalCost = pricedCosts.length
    ? { min: pricedCosts.reduce((sum, cost) => sum + cost.min, 0), max: pricedCosts.reduce((sum, cost) => sum + cost.max, 0) }
    : null;

  // Kept as history; nutrients per hectare from the middle of each range
  const nutrient = (fertilizer: Fertilizer) => {
    const item = items.find((entry) => entry.fertilizer === fertilizer);
    return item ? Math.round(middle(item.perHa) * NUTRIENT_SHARE[fertilizer as keyof typeof NUTRIENT_SHARE]) : 0;
  };
  const saved = await prisma.fertilizerRecommendation.create({
    data: {
      userId,
      farmId: field?.farmId ?? null,
      cropName: crop.name,
      recommendedN: nutrient("urea"),
      recommendedP: nutrient("tsp"),
      recommendedK: nutrient("mop"),
      notes: JSON.stringify({ cropId: crop.id, areaAcres, fertility, fieldName: field?.name ?? null }),
    },
    select: { id: true, createdAt: true },
  });

  return {
    id: saved.id,
    createdAt: saved.createdAt,
    crop: { id: crop.id, name: crop.name, nameBn: crop.nameBn },
    field: field && { id: field.id, name: field.name },
    areaAcres,
    fertility,
    items,
    organic,
    totalCost,
    timing: guide.timing,
    source: guide.source,
  };
});

// Earlier recommendations, newest first (enough to recognise and redo one)
export const getFertilizerHistory = serviceHandler(async (userId: string) => {
  const rows = await prisma.fertilizerRecommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, cropName: true, notes: true, createdAt: true },
  });
  return rows.map(({ notes, ...row }) => {
    let details: { cropId?: string; areaAcres?: number; fertility?: Fertility; fieldName?: string | null } = {};
    try {
      details = JSON.parse(notes ?? "{}");
    } catch {
      // older rows hold free text
    }
    return { ...row, ...details };
  });
});

export const deleteFertilizerRecommendation = serviceHandler(async (userId: string, id: string) => {
  const { count } = await prisma.fertilizerRecommendation.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound("Recommendation not found");
  return { id };
});
