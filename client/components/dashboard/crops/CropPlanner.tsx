"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import CreateCropFlow from "@/components/dashboard/crops/CreateCropFlow";
import CropCycleCard from "@/components/dashboard/crops/CropCycleCard";
import PlanTimeline from "@/components/dashboard/crops/PlanTimeline";
import { PlusIcon, SproutIcon, WheatIcon } from "@/components/icons";
import { getCyclePlan, setPlanTaskDone } from "@/lib/crops";
import type { Crop, CropCycleSummary, CropPlan, Field, MilestoneStatus } from "@/types/crops";

type CropPlannerProps = {
  initialCycles: CropCycleSummary[];
  crops: Crop[];
  fields: Field[];
  loadError: boolean;
};

// Re-computes the milestone and overall progress after a task is ticked.
function applyTaskToggle(plan: CropPlan, taskId: string, isDone: boolean): CropPlan {
  const milestones = plan.milestones.map((milestone) => {
    const tasks = milestone.tasks.map((task) => (task.id === taskId ? { ...task, isDone } : task));
    const touched = tasks.some((task) => task.id === taskId);
    if (!touched) return milestone;
    const doneTasks = tasks.filter((task) => task.isDone).length;
    const status: MilestoneStatus =
      doneTasks === 0 ? "PENDING" : doneTasks === tasks.length ? "DONE" : "PARTIAL";
    return {
      ...milestone,
      tasks,
      doneTasks,
      status,
    };
  });

  const doneTasks = milestones.reduce((sum, milestone) => sum + milestone.doneTasks, 0);
  const totalTasks = plan.progress.totalTasks;

  return {
    ...plan,
    milestones,
    progress: {
      ...plan.progress,
      doneTasks,
      percent: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    },
  };
}

// The crop-planning section: "My crops" on the left, the selected plan (or the
// "start a new crop" form) on the right. Ticks save to the API and roll back
// if the save fails.
export default function CropPlanner({ initialCycles, crops, fields, loadError }: CropPlannerProps) {
  const t = useTranslations("dashboard.crops");

  const [cycles, setCycles] = useState<CropCycleSummary[]>(initialCycles);
  const [selected, setSelected] = useState<CropCycleSummary | null>(null);
  const [plan, setPlan] = useState<CropPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [creating, setCreating] = useState(false);

  const didInit = useRef(false);

  // Open the newest cycle's plan right away so the page never lands empty.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (initialCycles[0]) openCycle(initialCycles[0]);
    // openCycle intentionally runs once with the initial list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCycle(cycle: CropCycleSummary) {
    setSelected(cycle);
    setCreating(false);
    if (plan?.cycleId === cycle.id) return;
    setPlan(null);
    setPlanError(false);
    setLoadingPlan(true);
    getCyclePlan(cycle.id)
      .then((loaded) => {
        setPlan(loaded);
        setLoadingPlan(false);
      })
      .catch(() => {
        setPlanError(true);
        setLoadingPlan(false);
      });
  }

  function startCreating() {
    setCreating(true);
    setPlanError(false);
  }

  async function toggleTask(taskId: string, isDone: boolean) {
    if (!plan) return;
    const previous = plan;
    setPlan(applyTaskToggle(plan, taskId, isDone));
    try {
      await setPlanTaskDone(plan.cycleId, taskId, isDone);
    } catch {
      setPlan(applyTaskToggle(previous, taskId, !isDone));
    }
  }

  async function handleCreated(cycle: CropCycleSummary) {
    setCycles((current) => [cycle, ...current]);
    openCycle(cycle);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <DashCard className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold md:text-3xl">
            <SproutIcon className="size-6 text-emerald-300" />
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">{t("intro")}</p>
        </div>
        <button
          type="button"
          onClick={startCreating}
          className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
        >
          <PlusIcon className="size-4" />
          {t("startNew")}
        </button>
      </DashCard>

      {loadError && (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {t("loadError")}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[19rem_1fr]">
        {/* Left: my crops */}
        <DashCard className="flex min-h-0 flex-col">
          <CardHeader icon={<WheatIcon />} title={t("myCrops")} />

          {cycles.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-sm text-white/70">{t("noCrops")}</p>
              <p className="text-xs text-white/50">{t("noCropsHint")}</p>
              <button
                type="button"
                onClick={startCreating}
                className="mt-1 flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium transition hover:bg-green-700"
              >
                <PlusIcon className="size-4" />
                {t("startNew")}
              </button>
            </div>
          ) : (
            <ul data-lenis-prevent className="-mr-2 mt-4 max-h-[34rem] flex-1 space-y-2 overflow-y-auto pr-2">
              {cycles.map((cycle) => (
                <CropCycleCard
                  key={cycle.id}
                  cycle={cycle}
                  isActive={selected?.id === cycle.id && !creating}
                  onSelect={openCycle}
                />
              ))}
            </ul>
          )}
        </DashCard>

        {/* Right: the plan or the create form */}
        <div className="min-w-0">
          {creating ? (
            <CreateCropFlow
              crops={crops}
              fields={fields}
              onCreated={handleCreated}
              onCancel={() => setCreating(false)}
            />
          ) : loadingPlan ? (
            <div className="flex flex-col gap-5">
              <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5" />
              <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5" />
            </div>
          ) : planError ? (
            <DashCard className="flex flex-col items-center gap-4 py-14 text-center">
              <p className="text-sm text-white/70">{t("planError")}</p>
              <button
                type="button"
                onClick={() => selected && openCycle(selected)}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/90 transition hover:bg-white/10"
              >
                {t("retry")}
              </button>
            </DashCard>
          ) : plan ? (
            <PlanTimeline plan={plan} onToggleTask={toggleTask} />
          ) : (
            <DashCard className="flex flex-col items-center gap-4 py-14 text-center">
              <WheatIcon className="size-10 text-emerald-300/60" />
              <p className="text-sm text-white/70">{t("selectHint")}</p>
            </DashCard>
          )}
        </div>
      </div>
    </div>
  );
}