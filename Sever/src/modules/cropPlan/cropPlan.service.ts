import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import {
  addDays,
  buildTaskInputs,
  getCropPlan,
  milestoneWindows,
  scaleFactor,
  type CropPlanEntry,
  type GrowthTaskCreateInput,
} from "./cropPlan.engine.js";

/**
 * Growth Plan service (Irfan).
 *
 * Auto-generates the cultivation timeline for a crop cycle:
 *   - POST   /api/crop-cycles/:id/plan       (re)generate tasks from the dataset
 *   - GET    /api/crop-cycles/:id/plan       milestones + tasks + progress
 *   - PATCH  /api/crop-cycles/:id/tasks/:taskId   mark a task done/undone
 *   - GET    /api/crops/:id/plan             template preview (public)
 *
 * Tasks are created automatically when a crop cycle is created (cropCycle.service),
 * so farmers get a usable checklist immediately after picking a crop and field.
 */

const MS_PER_DAY = 86_400_000;

function actualCycleDays(
  plantingDate: Date,
  expectedHarvestDate: Date | null,
  plan: CropPlanEntry | undefined,
): number | null {
  if (expectedHarvestDate) {
    return Math.max(1, Math.round((expectedHarvestDate.getTime() - plantingDate.getTime()) / MS_PER_DAY));
  }
  return plan?.durationDays ?? null;
}

export const getPlanForCycle = serviceHandler(async (cycleId: string, userId: string) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id: cycleId },
    include: {
      field: { include: { farm: true } },
      crop: true,
      growthTasks: { orderBy: { suggestedDay: "asc" } },
    },
  });

  if (!cycle || cycle.field.farm.userId !== userId) {
    return null;
  }

  const plan = await getCropPlan(cycle.crop.name, cycle.crop.id);
  const actualDays = actualCycleDays(cycle.plantingDate, cycle.expectedHarvestDate, plan);
  const scale = plan ? scaleFactor(plan.durationDays, actualDays) : 1;
  const windows = plan ? milestoneWindows({ plan, plantingDate: cycle.plantingDate, actualDurationDays: actualDays }) : [];

  // Group stored tasks by milestone, preserving first-seen order.
  const groupNames: string[] = [];
  const grouped = new Map<string, typeof cycle.growthTasks>();
  for (const task of cycle.growthTasks) {
    const key = task.milestone;
    if (!grouped.has(key)) {
      grouped.set(key, []);
      groupNames.push(key);
    }
    grouped.get(key)!.push(task);
  }

  const milestones = groupNames.map((name) => {
    const tasks = grouped.get(name)!;
    const window = windows.find((w) => w.name === name);
    const dayStart = window?.dayStart ?? Math.min(...tasks.map((t) => t.suggestedDay));
    const dayEnd = window?.dayEnd ?? Math.max(...tasks.map((t) => t.suggestedDay));
    const done = tasks.filter((t) => t.isDone).length;
    const status = done === 0 ? "PENDING" : done === tasks.length ? "DONE" : "PARTIAL";
    return {
      name,
      nameBn: tasks[0]?.milestoneBn ?? window?.nameBn,
      dayStart,
      dayEnd,
      startDate: addDays(cycle.plantingDate, dayStart),
      endDate: addDays(cycle.plantingDate, dayEnd),
      status,
      doneTasks: done,
      totalTasks: tasks.length,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        titleBn: t.titleBn,
        description: t.description,
        suggestedDay: t.suggestedDay,
        dueDate: t.dueDate,
        isDone: t.isDone,
        completedAt: t.completedAt,
      })),
    };
  });

  const totalTasks = cycle.growthTasks.length;
  const doneTasks = cycle.growthTasks.filter((t) => t.isDone).length;

  return {
    cycleId: cycle.id,
    crop: { id: cycle.crop.id, name: cycle.crop.name, nameBn: cycle.crop.nameBn },
    durationDays: actualDays,
    durationLabel: scale === 1 ? plan?.durationLabel : `${parseFloat((actualDays! / 30).toFixed(1))} months`,
    timeline: {
      plantingDate: cycle.plantingDate,
      expectedHarvestDate: cycle.expectedHarvestDate,
    },
    progress: {
      totalTasks,
      doneTasks,
      percent: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
    },
    milestones,
  };
});

export const generateTasksForCycle = serviceHandler(async (cycleId: string, userId: string) => {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id: cycleId },
    include: { field: { include: { farm: true } }, crop: true },
  });

  if (!cycle || cycle.field.farm.userId !== userId) {
    return null;
  }

  const plan = await getCropPlan(cycle.crop.name, cycle.crop.id);
  if (!plan) {
    throw AppError.notFound(`No cultivation plan is available yet for "${cycle.crop.name}"`);
  }

  const actualDays = actualCycleDays(cycle.plantingDate, cycle.expectedHarvestDate, plan);
  const inputs: GrowthTaskCreateInput[] = buildTaskInputs({
    plan,
    plantingDate: cycle.plantingDate,
    actualDurationDays: actualDays,
  });

  await prisma.$transaction([
    prisma.growthTask.deleteMany({ where: { cropCycleId: cycleId } }),
    prisma.growthTask.createMany({ data: inputs.map((t) => ({ ...t, cropCycleId: cycleId })) }),
  ]);

  return getPlanForCycle(cycleId, userId);
});

export const updateTaskStatus = serviceHandler(
  async (cycleId: string, taskId: string, userId: string, isDone: boolean) => {
    const cycle = await prisma.cropCycle.findUnique({
      where: { id: cycleId },
      include: { field: { include: { farm: true } } },
    });

    if (!cycle || cycle.field.farm.userId !== userId) {
      return null;
    }

    return await prisma.growthTask.update({
      where: { id: taskId, cropCycleId: cycleId },
      data: { isDone, completedAt: isDone ? new Date() : null },
    });
  },
);

/** Public template preview: what a crop's plan looks like before starting. */
export const getCropPlanTemplate = serviceHandler(
  async (cropId: string, plantingDateStr?: string) => {
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) return null;

    const plan = await getCropPlan(crop.name, crop.id);
    if (!plan) return null;

    const plantingDate = plantingDateStr ? new Date(plantingDateStr) : new Date();
    const windows = milestoneWindows({ plan, plantingDate, actualDurationDays: plan.durationDays });

    const rawTasks = buildTaskInputs({ plan, plantingDate, actualDurationDays: plan.durationDays });

    // Group template tasks under their milestone (matching buildTaskInputs order).
    const mapped = windows.map((w) => ({
      ...w,
      tasks: rawTasks.filter((t) => t.milestone === w.name).map((t) => ({
        title: t.title,
        titleBn: t.titleBn,
        description: t.description,
        suggestedDay: t.suggestedDay,
        dueDate: t.dueDate,
      })),
    }));

    return {
      crop: { id: crop.id, name: crop.name, nameBn: crop.nameBn },
      durationDays: plan.durationDays,
      durationLabel: plan.durationLabel,
      plantingDate,
      expectedHarvestDate: addDays(plantingDate, plan.durationDays),
      totalTasks: rawTasks.length,
      milestones: mapped,
    };
  },
);

export const CropPlanService = {
  getPlanForCycle,
  generateTasksForCycle,
  updateTaskStatus,
  getCropPlanTemplate,
};