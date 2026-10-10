import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { districtIn } from "../../utils/bdDistricts.js";
import { soilCode, soilCodes, soilFit, type SoilFit, type SoilType } from "../../utils/soil.js";
import { getWeatherReport, resolvePlace } from "../../services/weather.service.js";
import { farmerLocation } from "../aiAssistant/farmerContext.js";

// Which crops suit a field this month: planting window (crop list), soil (field), this week's
// temperature (weather) and price trend (market prices). A score orders them; the reasons
// let the farmer see why.

const DAY_MS = 24 * 60 * 60 * 1000;

type Timing = "NOW" | "SOON" | "LATER";
type TempFit = "GOOD" | "FAIR" | "POOR" | "UNKNOWN";

const SCORE = {
  timing: { NOW: 50, SOON: 30, LATER: 0 } satisfies Record<Timing, number>,
  soil: { GOOD: 25, FAIR: 12, POOR: 0, UNKNOWN: 8 } satisfies Record<SoilFit, number>,
  temp: { GOOD: 15, FAIR: 7, POOR: 0, UNKNOWN: 5 } satisfies Record<TempFit, number>,
  priceRising: 5,
};

// Planting window months, wrapping past December (11 → 1)
function inWindow(month: number, start: number | null, end: number | null) {
  if (!start || !end) return false;
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

const nextMonth = (month: number) => (month % 12) + 1;

// When it would be planted: today in season, otherwise the 1st of the next month it can be
// (next month for "soon", the window's first month for "later")
function plantingDate(timing: Timing, month: number, sowingStart: number | null): Date | null {
  if (timing === "NOW") return new Date();
  const target = timing === "SOON" ? nextMonth(month) : sowingStart;
  if (!target) return null;
  const monthsAhead = (target - month + 12) % 12 || 12;
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), month - 1 + monthsAhead, 1));
}

// This month in Bangladesh (1-12)
const currentMonth = () => Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", month: "numeric" }).format(new Date()));

// Latest price and the change from about a week before, for each crop that has a price item
async function cropPrices() {
  const items = await prisma.priceItem.findMany({
    where: { isActive: true, cropId: { not: null }, category: "CROP" },
    orderBy: { sortOrder: "asc" },
    select: {
      cropId: true,
      nameBn: true,
      nameEn: true,
      unitBn: true,
      unitEn: true,
      records: { orderBy: { date: "desc" }, take: 10, select: { minPrice: true, maxPrice: true, date: true } },
    },
  });

  const byCrop = new Map<string, { nameBn: string; nameEn: string; unitBn: string; unitEn: string; minPrice: number; maxPrice: number; weekChangePercent: number | null }>();
  for (const item of items) {
    const [latest, ...older] = item.records;
    // The first item per crop (catalog order) speaks for it, e.g. coarse rice for rice
    if (!item.cropId || !latest || byCrop.has(item.cropId)) continue;
    const weekAgo = older.find((record) => record.date.getTime() <= latest.date.getTime() - 7 * DAY_MS);
    const mid = (record: { minPrice: number; maxPrice: number }) => (record.minPrice + record.maxPrice) / 2;
    byCrop.set(item.cropId, {
      nameBn: item.nameBn,
      nameEn: item.nameEn,
      unitBn: item.unitBn,
      unitEn: item.unitEn,
      minPrice: latest.minPrice,
      maxPrice: latest.maxPrice,
      weekChangePercent: weekAgo ? Math.round(((mid(latest) - mid(weekAgo)) / mid(weekAgo)) * 1000) / 10 : null,
    });
  }
  return byCrop;
}

export type CropAdviceInput = { fieldId?: unknown; soilType?: unknown; month?: unknown };

export const recommendCrops = serviceHandler(async (userId: string, input: CropAdviceInput) => {
  const field =
    typeof input.fieldId === "string" && input.fieldId
      ? await prisma.field.findFirst({
          where: { id: input.fieldId, farm: { userId } },
          select: { id: true, name: true, soilType: true, farm: { select: { soilType: true, location: true } } },
        })
      : null;
  if (input.fieldId && !field) throw AppError.notFound("Field not found");

  const month = Number(input.month) >= 1 && Number(input.month) <= 12 ? Number(input.month) : currentMonth();
  const soil: SoilType | null =
    soilCode(typeof input.soilType === "string" ? input.soilType : null) ??
    soilCode(field?.soilType) ??
    soilCode(field?.farm.soilType);
  const location = field?.farm.location ?? (await farmerLocation(userId));
  const district = location ? districtIn(location) : null;

  // This week's average temperature where the land is (only judged for planting now)
  let averageTempC: number | null = null;
  try {
    const { days } = await getWeatherReport(await resolvePlace(location));
    const week = days.slice(0, 7);
    if (week.length) averageTempC = Math.round((week.reduce((sum, day) => sum + (day.maxTempC + day.minTempC) / 2, 0) / week.length) * 10) / 10;
  } catch {
    // weather is a bonus; the advice still works without it
  }

  const [crops, prices] = await Promise.all([prisma.crop.findMany({ orderBy: { name: "asc" } }), cropPrices()]);

  const advice = crops.map((crop) => {
    const timing: Timing = inWindow(month, crop.sowingStartMonth, crop.sowingEndMonth)
      ? "NOW"
      : inWindow(nextMonth(month), crop.sowingStartMonth, crop.sowingEndMonth)
        ? "SOON"
        : "LATER";
    const soilMatch = soilFit(soil, soilCodes(crop.idealSoil));

    let tempFit: TempFit = "UNKNOWN";
    if (timing === "NOW" && averageTempC !== null && crop.optimalTemp !== null) {
      const gap = Math.abs(averageTempC - crop.optimalTemp);
      tempFit = gap <= 4 ? "GOOD" : gap <= 8 ? "FAIR" : "POOR";
    }

    const price = prices.get(crop.id) ?? null;
    const priceRising = price?.weekChangePercent !== null && price?.weekChangePercent !== undefined && price.weekChangePercent > 0;
    const score = SCORE.timing[timing] + SCORE.soil[soilMatch] + SCORE.temp[tempFit] + (priceRising ? SCORE.priceRising : 0);

    const plantOn = plantingDate(timing, month, crop.sowingStartMonth);
    const harvestBy = plantOn && crop.durationDays ? new Date(plantOn.getTime() + crop.durationDays * DAY_MS) : null;

    return {
      crop: { id: crop.id, name: crop.name, nameBn: crop.nameBn, durationDays: crop.durationDays },
      sowing: { startMonth: crop.sowingStartMonth, endMonth: crop.sowingEndMonth },
      timing,
      soilFit: soilMatch,
      idealSoils: soilCodes(crop.idealSoil),
      tempFit,
      optimalTempC: crop.optimalTemp,
      harvestBy,
      price,
      score,
    };
  });
  advice.sort((a, b) => b.score - a.score);

  const recommended = advice.filter((entry) => entry.timing !== "LATER");
  const saved = await prisma.cropRecommendation.create({
    data: {
      userId,
      location: district ?? location ?? "-",
      soilType: soil ?? "-",
      season: String(month),
      recommendedCrops: JSON.stringify(recommended.slice(0, 5).map((entry) => entry.crop.name)),
    },
    select: { id: true, createdAt: true },
  });

  return {
    id: saved.id,
    createdAt: saved.createdAt,
    month,
    soilType: soil,
    district,
    field: field && { id: field.id, name: field.name },
    averageTempC,
    crops: advice,
  };
});

// Earlier recommendations, newest first
export const getCropHistory = serviceHandler(async (userId: string) => {
  const rows = await prisma.cropRecommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows.map((row) => {
    let crops: string[] = [];
    try {
      crops = JSON.parse(row.recommendedCrops);
    } catch {
      crops = [row.recommendedCrops];
    }
    return { id: row.id, createdAt: row.createdAt, month: Number(row.season) || null, soilType: row.soilType, district: row.location, crops };
  });
});

export const deleteCropRecommendation = serviceHandler(async (userId: string, id: string) => {
  const { count } = await prisma.cropRecommendation.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound("Recommendation not found");
  return { id };
});
