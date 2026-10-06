import { readFileSync } from "node:fs";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Crop-plan dataset engine (Irfan — Growth Plan feature).
 *
 * Template data lives in the DATABASE (crop_milestone_template /
 * crop_task_template + crop.planDurationDays), seeded from
 * src/data/crop-plans.json — the editable, human-friendly seed source.
 * Runtime reads come from the database; the JSON file is only the seed input.
 *
 * The engine turns a crop's template rows into the per-crop-cycle task set.
 * Day offsets are proportional to the crop duration, so a farmer's custom
 * expectedHarvestDate (e.g. 4 months instead of 3) scales every date.
 */

export interface CropPlanTaskTemplate {
  title: string;
  titleBn?: string;
  suggestedDay: number;
  description?: string;
}

export interface CropPlanMilestoneTemplate {
  name: string;
  nameBn?: string;
  dayStart: number;
  dayEnd: number;
  tasks: CropPlanTaskTemplate[];
}

export interface CropPlanEntry {
  cropId?: string;
  cropName?: string;
  durationDays: number;
  durationLabel?: string | null;
  milestones: CropPlanMilestoneTemplate[];
}

/** Payload accepted by prisma.growthTask.createMany. */
export interface GrowthTaskCreateInput {
  milestone: string;
  milestoneBn?: string;
  title: string;
  titleBn?: string;
  description?: string;
  suggestedDay: number;
  dueDate?: Date;
}

// ---------------------------------------------------------------------------
// Seed source: the demo JSON (used by prisma/seed.ts to populate the tables)
// ---------------------------------------------------------------------------
export function readCropPlansJson(): Record<string, CropPlanEntry> {
  const raw = JSON.parse(
    readFileSync(new URL("../../data/crop-plans.json", import.meta.url), "utf8"),
  ) as Record<string, unknown>;

  const plans: Record<string, CropPlanEntry> = {};
  for (const [name, entry] of Object.entries(raw)) {
    if (name.startsWith("_")) continue;
    const e = entry as CropPlanEntry;
    if (typeof e !== "object" || !e) {
      throw new AppError(500, "Crop plans dataset is malformed");
    }
    if (!Number.isFinite(e.durationDays) || e.durationDays <= 0) {
      throw new AppError(500, `Crop plan "${name}" is missing a valid durationDays`);
    }
    if (!Array.isArray(e.milestones)) {
      throw new AppError(500, `Crop plan "${name}" is missing milestones`);
    }
    plans[name] = e;
  }
  return plans;
}

// ---------------------------------------------------------------------------
// Runtime source: the database (populated by the seed from the JSON above)
// ---------------------------------------------------------------------------
let cachedPlans: CropPlanEntry[] | null = null;

async function loadCropPlans(): Promise<CropPlanEntry[]> {
  if (cachedPlans) return cachedPlans;

  const crops = await prisma.crop.findMany({
    where: { milestoneTemplates: { some: {} } },
    include: {
      milestoneTemplates: {
        include: { tasks: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const result = crops.map((crop) => ({
    cropId: crop.id,
    cropName: crop.name,
    durationDays: crop.planDurationDays ?? crop.durationDays ?? 0,
    durationLabel: crop.planDurationLabel,
    milestones: crop.milestoneTemplates.map((m) => ({
      name: m.name,
      nameBn: m.nameBn ?? undefined,
      dayStart: m.dayStart,
      dayEnd: m.dayEnd,
      tasks: m.tasks.map((t) => ({
        title: t.title,
        titleBn: t.titleBn ?? undefined,
        suggestedDay: t.suggestedDay,
        description: t.description ?? undefined,
      })),
    })),
  }));

  cachedPlans = result;
  return result;
}

/**
 * Find the plan for a crop. Prefers an exact cropId match; otherwise matches
 * by name, tolerating case difference and extra words (e.g. "Rice (Boro)"
 * still matches the "rice" plan).
 */
export async function getCropPlan(
  cropName?: string | null,
  cropId?: string | null,
): Promise<CropPlanEntry | undefined> {
  const plans = await loadCropPlans();
  if (cropId) {
    const byId = plans.find((p) => p.cropId === cropId);
    if (byId) return byId;
  }
  if (!cropName) return undefined;

  const key = cropName.trim().toLowerCase();
  return plans.find((p) => {
    const k = p.cropName?.trim().toLowerCase() ?? "";
    return key === k || key.startsWith(k) || k.startsWith(key);
  });
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Scale scheme: if the farmer asked for a custom total duration (via
 * expectedHarvestDate), every day offset is multiplied by
 * actualDays / plan.durationDays.
 */
export function scaleFactor(planDurationDays: number, actualDurationDays?: number | null): number {
  if (actualDurationDays && Number.isFinite(actualDurationDays) && actualDurationDays > 0) {
    return actualDurationDays / planDurationDays;
  }
  return 1;
}

/** Build the createMany-ready task list (directly from a plan entry). */
export function buildTaskInputs(options: {
  plan: CropPlanEntry;
  plantingDate: Date;
  actualDurationDays?: number | null;
}): GrowthTaskCreateInput[] {
  const { plan, plantingDate } = options;
  const scale = scaleFactor(plan.durationDays, options.actualDurationDays);

  const inputs: GrowthTaskCreateInput[] = [];
  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      const suggestedDay = Math.min(Math.max(Math.round(task.suggestedDay * scale), 0), 365);
      inputs.push({
        milestone: milestone.name,
        milestoneBn: milestone.nameBn,
        title: task.title,
        titleBn: task.titleBn,
        description: task.description,
        suggestedDay,
        dueDate: addDays(plantingDate, suggestedDay),
      });
    }
  }
  return inputs;
}

/** Day window of every milestone for a given planting date (+ optional scaling). */
export function milestoneWindows(options: {
  plan: CropPlanEntry;
  plantingDate: Date;
  actualDurationDays?: number | null;
}): Array<{
  name: string;
  nameBn?: string;
  dayStart: number;
  dayEnd: number;
  startDate: Date;
  endDate: Date;
}> {
  const { plan, plantingDate } = options;
  const scale = scaleFactor(plan.durationDays, options.actualDurationDays);
  return plan.milestones.map((m) => {
    const dayStart = Math.min(Math.max(Math.round(m.dayStart * scale), 0), 365);
    const dayEnd = Math.min(Math.max(Math.round(m.dayEnd * scale), dayStart), 365);
    return {
      name: m.name,
      nameBn: m.nameBn,
      dayStart,
      dayEnd,
      startDate: addDays(plantingDate, dayStart),
      endDate: addDays(plantingDate, dayEnd),
    };
  });
}