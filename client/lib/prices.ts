import { api, API_URL } from "@/lib/api";

// Live prices: crops (TCB, daily), fertilizer (government rates) and pesticides (admin MRP),
// with what farmers report paying.

export type PriceCategory = "CROP" | "FERTILIZER" | "PESTICIDE";
export type PriceSource = "TCB" | "GOVERNMENT" | "ADMIN";

export const PRICE_CATEGORIES: PriceCategory[] = ["CROP", "FERTILIZER", "PESTICIDE"];

export type OfficialPrice = {
  minPrice: number;
  maxPrice: number;
  date: string;
  source: PriceSource;
  district: string;
};

export type ReportSummary = {
  // The viewer's district (from their profile), when known, in English and Bangla
  district: string | null;
  districtBn: string | null;
  districtMedian: number | null;
  districtCount: number;
  nationalMedian: number | null;
  nationalCount: number;
};

export type PriceItem = {
  id: string;
  slug: string;
  category: PriceCategory;
  nameBn: string;
  nameEn: string;
  unitBn: string;
  unitEn: string;
  details: string | null;
  cropId: string | null;
  official: OfficialPrice | null;
  weekChangePercent: number | null;
  reports: ReportSummary;
};

export type PricePoint = { date: string; minPrice: number; maxPrice: number };

type Envelope<T> = { data: T };

export const itemName = (item: Pick<PriceItem, "nameBn" | "nameEn">, locale: string) =>
  locale === "bn" ? item.nameBn : item.nameEn;

export const itemUnit = (item: Pick<PriceItem, "unitBn" | "unitEn">, locale: string) =>
  locale === "bn" ? item.unitBn : item.unitEn;

// A district in English (as stored and sent back as ?district=) and Bangla
export type DistrictLabel = { en: string; bn: string };

export type PriceList = {
  // Whose farmer reports the items' `reports` sum up
  district: DistrictLabel | null;
  // The district in the signed-in farmer's profile
  homeDistrict: DistrictLabel | null;
  items: PriceItem[];
};

// One category; farmer reports for `district` (English name), or the farmer's own district
export async function getPrices(category: PriceCategory, district?: string | null) {
  const query = district ? `&district=${encodeURIComponent(district)}` : "";
  return (await api<Envelope<PriceList>>(`/api/prices?category=${category}${query}`)).data;
}

export async function getPriceHistory(itemId: string) {
  return (await api<Envelope<PricePoint[]>>(`/api/prices/items/${itemId}/history`)).data;
}

// Today's price the farmer paid (or got), per the item's unit
export async function reportPrice(itemId: string, price: number) {
  await api("/api/prices/reports", { method: "POST", body: JSON.stringify({ itemId, price }) });
}

export type PriceHighlights = { crops: PriceItem[]; fertilizers: PriceItem[] };

// For the home page (server side): cached for a while, the prices change once a day
export async function getPriceHighlights(): Promise<PriceHighlights | null> {
  try {
    const res = await fetch(`${API_URL}/api/prices/highlights`, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return ((await res.json()) as Envelope<PriceHighlights>).data;
  } catch {
    return null;
  }
}

// ---- Admin ----

export type AdminPriceItem = Omit<PriceItem, "official" | "weekChangePercent" | "reports"> & {
  isActive: boolean;
  latest: (OfficialPrice & { id: string }) | null;
};

export type PriceItemInput = {
  category: PriceCategory;
  nameBn: string;
  nameEn: string;
  unitBn: string;
  unitEn: string;
  details: string;
};

export async function getAdminPriceItems() {
  return (await api<Envelope<AdminPriceItem[]>>("/api/prices/admin/items")).data;
}

export async function createPriceItem(input: PriceItemInput) {
  await api("/api/prices/items", { method: "POST", body: JSON.stringify(input) });
}

export async function setPriceItemActive(itemId: string, isActive: boolean) {
  await api(`/api/prices/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
}

export async function setOfficialPrice(itemId: string, minPrice: number, maxPrice: number, date?: string) {
  await api(`/api/prices/items/${itemId}/prices`, {
    method: "POST",
    body: JSON.stringify({ minPrice, maxPrice, date }),
  });
}

export async function importTcbNow() {
  return (await api<Envelope<{ importedDays: number; latestDate: string | null } | null>>("/api/prices/import/tcb", {
    method: "POST",
  })).data;
}
