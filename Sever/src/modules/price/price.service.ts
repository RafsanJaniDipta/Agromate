import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { DISTRICT_NAMES, districtIn } from "../../utils/bdDistricts.js";
import type { PriceCategory, PriceRecord, PriceSource } from "../../generated/prisma/client.js";
import { CATALOG, HIGHLIGHT_SLUGS } from "./price.catalog.js";

// Prices farmers follow: crops (TCB, daily), fertilizer (government rates) and pesticides
// (admin MRP), each next to what farmers in the same district report paying.

const NATIONWIDE = "Bangladesh";
const DAY_MS = 24 * 60 * 60 * 1000;
// Farmer reports older than this are left out of the "farmers are paying" figure
const REPORT_WINDOW_DAYS = 15;
const HISTORY_DAYS = 30;
// A report this far from the official price is almost certainly a typo
const REPORT_SANITY_FACTOR = 5;
const MAX_PRICE = 1_000_000;

export const PRICE_CATEGORIES: PriceCategory[] = ["CROP", "FERTILIZER", "PESTICIDE"];

// Today's calendar date in Bangladesh, at UTC midnight (how @db.Date values come back)
function todayInDhaka(): Date {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" })
    .format(new Date())
    .split("-")
    .map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
}

const daysBefore = (date: Date, days: number) => new Date(date.getTime() - days * DAY_MS);
const average = (record: Pick<PriceRecord, "minPrice" | "maxPrice">) => (record.minPrice + record.maxPrice) / 2;

// "Bogra" → "বগুড়া" (falls back to the stored name)
const banglaDistrict = (district: string) =>
  Object.keys(DISTRICT_NAMES).find((bn) => DISTRICT_NAMES[bn] === district) ?? district;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

// ---- Catalog ----

// Creates the built-in items (and the government fertilizer rates) the first time, and keeps
// their names and crop links current. Admin edits to prices are never overwritten.
export async function syncCatalog() {
  const crops = await prisma.crop.findMany({ select: { id: true, name: true } });
  const cropIdFor = (prefix?: string) =>
    prefix ? (crops.find((crop) => crop.name.toLowerCase().startsWith(prefix.toLowerCase()))?.id ?? null) : null;

  for (const [index, entry] of CATALOG.entries()) {
    const fields = {
      category: entry.category,
      nameBn: entry.nameBn,
      nameEn: entry.nameEn,
      unitBn: entry.unitBn,
      unitEn: entry.unitEn,
      cropId: cropIdFor(entry.cropPrefix),
      sortOrder: index,
    };
    const item = await prisma.priceItem.upsert({
      where: { slug: entry.slug },
      update: fields,
      create: { slug: entry.slug, ...fields },
    });

    if (entry.governmentPrice !== undefined) {
      const hasRate = await prisma.priceRecord.findFirst({ where: { itemId: item.id, source: "GOVERNMENT" } });
      if (!hasRate) {
        await prisma.priceRecord.create({
          data: {
            itemId: item.id,
            district: NATIONWIDE,
            minPrice: entry.governmentPrice,
            maxPrice: entry.governmentPrice,
            date: todayInDhaka(),
            source: "GOVERNMENT",
          },
        });
      }
    }
  }
}

// ---- Reading prices ----

type ReportSummary = {
  // The viewer's district, when known (English, as stored, and Bangla)
  district: string | null;
  districtBn: string | null;
  districtMedian: number | null;
  districtCount: number;
  nationalMedian: number | null;
  nationalCount: number;
};

async function describeItems(where: { category?: PriceCategory; slug?: { in: string[] } }, district: string | null) {
  const items = await prisma.priceItem.findMany({
    where: { ...where, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
  });
  const itemIds = items.map((item) => item.id);
  const today = todayInDhaka();

  const [latestRecords, recentRecords, reports] = await Promise.all([
    // The newest official price of each item, however old (fertilizer rates rarely change)
    prisma.priceRecord.findMany({
      where: { itemId: { in: itemIds } },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      distinct: ["itemId"],
    }),
    // Enough history to compare with a week earlier
    prisma.priceRecord.findMany({
      where: { itemId: { in: itemIds }, date: { gte: daysBefore(today, 21) } },
      orderBy: { date: "desc" },
    }),
    prisma.priceReport.findMany({
      where: { itemId: { in: itemIds }, date: { gte: daysBefore(today, REPORT_WINDOW_DAYS) } },
      select: { itemId: true, district: true, price: true },
    }),
  ]);

  return items.map((item) => {
    const latest = latestRecords.find((record) => record.itemId === item.id) ?? null;

    // Same source and place, about a week before the latest price
    const weekAgo = latest
      ? recentRecords.find(
          (record) =>
            record.itemId === item.id &&
            record.source === latest.source &&
            record.district === latest.district &&
            record.date.getTime() <= latest.date.getTime() - 7 * DAY_MS,
        )
      : undefined;
    const weekChangePercent =
      latest && weekAgo ? Math.round(((average(latest) - average(weekAgo)) / average(weekAgo)) * 1000) / 10 : null;

    const itemReports = reports.filter((report) => report.itemId === item.id);
    const districtReports = district ? itemReports.filter((report) => report.district === district) : [];
    const summary: ReportSummary = {
      district,
      districtBn: district ? banglaDistrict(district) : null,
      districtMedian: median(districtReports.map((report) => report.price)),
      districtCount: districtReports.length,
      nationalMedian: median(itemReports.map((report) => report.price)),
      nationalCount: itemReports.length,
    };

    return {
      id: item.id,
      slug: item.slug,
      category: item.category,
      nameBn: item.nameBn,
      nameEn: item.nameEn,
      unitBn: item.unitBn,
      unitEn: item.unitEn,
      details: item.details,
      cropId: item.cropId,
      official: latest && {
        minPrice: latest.minPrice,
        maxPrice: latest.maxPrice,
        date: latest.date,
        source: latest.source,
        district: latest.district,
      },
      weekChangePercent,
      reports: summary,
    };
  });
}

// The district in a farmer's profile location, if it names one
async function districtOf(userId?: string) {
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { location: true } });
  return user?.location ? districtIn(user.location) : null;
}

// One category's items with their latest official price and what farmers report
// A district in both languages, for the client to show
const labelled = (district: string | null) => (district ? { en: district, bn: banglaDistrict(district) } : null);

// Is this one of the 64 districts (English name, as stored)?
export const isKnownDistrict = (district: string) => Object.values(DISTRICT_NAMES).includes(district);

// One category's items with their latest official price and what farmers report. Farmer
// reports are summed up for `district` if given, otherwise for the farmer's own district.
export const getPrices = serviceHandler(
  async (category: PriceCategory, userId?: string, requestedDistrict?: string) => {
    const homeDistrict = await districtOf(userId);
    const district = requestedDistrict ?? homeDistrict;
    return {
      district: labelled(district),
      homeDistrict: labelled(homeDistrict),
      items: await describeItems({ category }, district),
    };
  },
);

// A few crops and fertilizers for the home page banner
export const getHighlights = serviceHandler(async () => {
  const items = await describeItems({ slug: { in: [...HIGHLIGHT_SLUGS.CROP, ...HIGHLIGHT_SLUGS.FERTILIZER] } }, null);
  const pick = (slugs: readonly string[]) =>
    slugs.map((slug) => items.find((item) => item.slug === slug)).filter((item) => item !== undefined);
  return { crops: pick(HIGHLIGHT_SLUGS.CROP), fertilizers: pick(HIGHLIGHT_SLUGS.FERTILIZER) };
});

// Official prices of the last 30 days for one item, oldest first (for the trend chart)
export const getHistory = serviceHandler(async (itemId: string) => {
  const latest = await prisma.priceRecord.findFirst({ where: { itemId }, orderBy: { date: "desc" } });
  if (!latest) return [];

  const records = await prisma.priceRecord.findMany({
    where: {
      itemId,
      source: latest.source,
      district: latest.district,
      date: { gte: daysBefore(latest.date, HISTORY_DAYS) },
    },
    orderBy: { date: "asc" },
    select: { date: true, minPrice: true, maxPrice: true },
  });
  return records;
});

// ---- Farmer reports ----

// What a farmer paid today for an item (one report per item and day; a new one replaces it)
export const reportPrice = serviceHandler(async (userId: string, itemId: string, rawPrice: unknown) => {
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE) {
    throw AppError.unprocessable("Enter a price above 0");
  }

  const item = await prisma.priceItem.findFirst({ where: { id: itemId, isActive: true } });
  if (!item) throw AppError.notFound("Item not found");

  const official = await prisma.priceRecord.findFirst({ where: { itemId }, orderBy: { date: "desc" } });
  if (official) {
    const reference = average(official);
    if (price > reference * REPORT_SANITY_FACTOR || price < reference / REPORT_SANITY_FACTOR) {
      throw AppError.unprocessable("This price is far from the market price. Check the amount and the unit.");
    }
  }

  const date = todayInDhaka();
  const district = await districtOf(userId);
  return prisma.priceReport.upsert({
    where: { itemId_userId_date: { itemId, userId, date } },
    update: { price, district },
    create: { itemId, userId, date, price, district },
    select: { id: true, itemId: true, price: true, district: true, date: true },
  });
});

// ---- Admin ----

export type PriceItemInput = {
  category?: unknown;
  nameBn?: unknown;
  nameEn?: unknown;
  unitBn?: unknown;
  unitEn?: unknown;
  details?: unknown;
  isActive?: unknown;
};

const text = (value: unknown, max = 120) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// Every item, hidden ones too, with its latest official price
export const getAllItemsForAdmin = serviceHandler(async () => {
  const items = await prisma.priceItem.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { nameBn: "asc" }],
    include: { records: { orderBy: { date: "desc" }, take: 1 } },
  });
  return items.map(({ records, ...item }) => ({ ...item, latest: records[0] ?? null }));
});

export const createItem = serviceHandler(async (input: PriceItemInput) => {
  const category = input.category as PriceCategory;
  if (!PRICE_CATEGORIES.includes(category)) throw AppError.unprocessable("Choose crop, fertilizer or pesticide");

  const fields = {
    nameBn: text(input.nameBn),
    nameEn: text(input.nameEn),
    unitBn: text(input.unitBn, 40),
    unitEn: text(input.unitEn, 40),
  };
  if (Object.values(fields).some((value) => !value)) {
    throw AppError.unprocessable("Name and unit are needed in Bangla and English");
  }

  return prisma.priceItem.create({
    data: {
      ...fields,
      category,
      details: text(input.details, 300) || null,
      slug: `custom-${crypto.randomUUID()}`,
      sortOrder: 1000,
    },
  });
});

export const updateItem = serviceHandler(async (itemId: string, input: PriceItemInput) => {
  const data: Record<string, unknown> = {};
  for (const key of ["nameBn", "nameEn", "unitBn", "unitEn"] as const) {
    if (input[key] !== undefined) {
      const value = text(input[key], key.startsWith("unit") ? 40 : 120);
      if (!value) throw AppError.unprocessable(`${key} can't be empty`);
      data[key] = value;
    }
  }
  if (input.details !== undefined) data.details = text(input.details, 300) || null;
  if (typeof input.isActive === "boolean") data.isActive = input.isActive;

  return prisma.priceItem.update({ where: { id: itemId }, data }).catch(() => {
    throw AppError.notFound("Item not found");
  });
});

// Sets an item's official price for a day (today by default). Fertilizer prices count as the
// government rate, everything else as the admin's price; both apply nationwide.
export const setOfficialPrice = serviceHandler(
  async (itemId: string, input: { minPrice?: unknown; maxPrice?: unknown; date?: unknown }) => {
    const item = await prisma.priceItem.findUnique({ where: { id: itemId } });
    if (!item) throw AppError.notFound("Item not found");

    const minPrice = Number(input.minPrice);
    const maxPrice = input.maxPrice === undefined || input.maxPrice === "" ? minPrice : Number(input.maxPrice);
    if (!(minPrice > 0) || !(maxPrice >= minPrice) || maxPrice > MAX_PRICE) {
      throw AppError.unprocessable("Enter a price above 0 (the highest can't be below the lowest)");
    }

    const date = typeof input.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
      ? new Date(`${input.date}T00:00:00Z`)
      : todayInDhaka();
    const source: PriceSource = item.category === "FERTILIZER" ? "GOVERNMENT" : "ADMIN";
    const key = { itemId, district: NATIONWIDE, date, source };

    return prisma.priceRecord.upsert({
      where: { itemId_district_date_source: key },
      update: { minPrice, maxPrice },
      create: { ...key, minPrice, maxPrice },
    });
  },
);
