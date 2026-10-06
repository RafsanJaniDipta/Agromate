import { cache } from "react";
import { api } from "@/lib/api";
import type { Crop, CropCycleSummary, CropPlan, Farm, Field } from "@/types/crops";

// The server wraps every response as { success, message, data }
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Browser requests send the login cookie along, so the API knows whose farm it is
const withSession: RequestInit = { credentials: "include" };

export type CropsPageData = {
  crops: Crop[];
  cycles: CropCycleSummary[];
  fields: Field[];
  // True when at least one request failed; the page renders with what it has
  loadError: boolean;
};

// Everything the crop-planning page needs, in parallel requests.
// Runs on the server, so the visitor's cookies are forwarded by hand.
// Failures degrade to empty arrays so the page still chunks in.
export const getCropsPage = cache(async (cookieHeader: string): Promise<CropsPageData> => {
  const [cropsRes, cyclesRes, farmsRes] = await Promise.allSettled([
    api<ApiEnvelope<Crop[]>>("/api/crops", { cache: "no-store" }),
    api<ApiEnvelope<CropCycleSummary[]>>("/api/crop-cycles", {
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      cache: "no-store",
    }),
    api<ApiEnvelope<Farm[]>>("/api/farms", {
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const fields =
    farmsRes.status === "fulfilled" ? farmsRes.value.data.flatMap((farm) => farm.fields) : [];

  return {
    crops: cropsRes.status === "fulfilled" ? cropsRes.value.data : [],
    cycles: cyclesRes.status === "fulfilled" ? cyclesRes.value.data : [],
    fields,
    loadError:
      cropsRes.status !== "fulfilled" ||
      cyclesRes.status !== "fulfilled" ||
      farmsRes.status !== "fulfilled",
  };
});

// Starts a crop cycle; the backend auto-builds its milestones + tasks.
export async function createCropCycle(input: {
  fieldId: string;
  cropId: string;
  plantingDate: string;
  expectedHarvestDate?: string;
}): Promise<CropCycleSummary> {
  const { data } = await api<ApiEnvelope<CropCycleSummary>>("/api/crop-cycles", {
    ...withSession,
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

// Loads one cycle's growth plan: milestones + tasks + progress.
export async function getCyclePlan(cycleId: string): Promise<CropPlan> {
  const { data } = await api<ApiEnvelope<CropPlan>>(`/api/crop-cycles/${cycleId}/plan`, withSession);
  return data;
}

// Marks a plan task done or reopens it.
export async function setPlanTaskDone(cycleId: string, taskId: string, isDone: boolean): Promise<void> {
  await api(`/api/crop-cycles/${cycleId}/tasks/${taskId}`, {
    ...withSession,
    method: "PATCH",
    body: JSON.stringify({ isDone }),
  });
}

// --- Date helpers ----------------------------------------------------------

// "2026-10-01" → "1 Oct" in the active locale
export function formatDay(locale: string, iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date);
}

// Local timezone-safe value for <input type="date">
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}