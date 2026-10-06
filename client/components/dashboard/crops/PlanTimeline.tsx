"use client";

import { useLocale, useTranslations } from "next-intl";
import { CheckIcon, LeafIcon } from "@/components/icons";
import { formatDay } from "@/lib/crops";
import type { CropPlan, MilestoneStatus } from "@/types/crops";

type PlanTimelineProps = {
  plan: CropPlan;
  onToggleTask: (taskId: string, isDone: boolean) => void;
};

const statusTone: Record<MilestoneStatus, string> = {
  PENDING: "border-white/10 bg-white/5 text-white/60",
  PARTIAL: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  DONE: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const dotTone: Record<MilestoneStatus, string> = {
  PENDING: "bg-white/30",
  PARTIAL: "bg-amber-400",
  DONE: "bg-emerald-400",
};

// The growing plan of one crop cycle: an overall progress bar, then a vertical
// timeline of milestones, each with its checklist of tasks.
export default function PlanTimeline({ plan, onToggleTask }: PlanTimelineProps) {
  const t = useTranslations("dashboard.crops");
  const locale = useLocale();
  const cropName = locale === "bn" && plan.crop.nameBn ? plan.crop.nameBn : plan.crop.name;

  const pickName = (en: string, bn: string | null) => (locale === "bn" && bn ? bn : en);

  return (
    <div className="flex flex-col gap-5">
      {/* Header: crop + timeline + overall progress */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {plan.durationLabel ?? `${plan.durationDays} days`}
          </span>
          {plan.timeline.expectedHarvestDate && (
            <span className="text-sm text-white/60">
              {t("window", {
                from: formatDay(locale, plan.timeline.plantingDate),
                to: formatDay(locale, plan.timeline.expectedHarvestDate),
              })}
            </span>
          )}
        </div>

        <h2 className="mt-3 flex items-center gap-2.5 text-lg font-semibold">
          <LeafIcon className="size-5 text-emerald-300" />
          {cropName}
        </h2>

        {plan.milestones.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">
            {t("emptyPlan")} — {t("emptyPlanHint")}
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm">
              {t.rich("progress", {
                done: plan.progress.doneTasks,
                total: plan.progress.totalTasks,
                highlight: (chunks) => <span className="text-emerald-300">{chunks}</span>,
              })}
            </p>
            <div
              role="progressbar"
              aria-label={cropName}
              aria-valuenow={plan.progress.doneTasks}
              aria-valuemin={0}
              aria-valuemax={plan.progress.totalTasks}
              className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
                style={{ width: `${plan.progress.percent}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Vertical timeline of milestones */}
      {plan.milestones.length > 0 && (
        <ol className="relative space-y-4">
          {/* The vertical line behind every milestone dot */}
          <span aria-hidden className="absolute bottom-6 left-[1.15rem] top-2 w-px bg-white/10" />

          {plan.milestones.map((milestone) => {
            const status = milestone.status as MilestoneStatus;
            return (
              <li key={milestone.name} className="relative flex gap-4">
                <span
                  aria-hidden
                  className={`mt-1 size-9 shrink-0 rounded-full border-2 border-zinc-900 ${dotTone[status]} ring-1 ring-white/20`}
                />

                <section className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-black/40 p-4">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">{pickName(milestone.name, milestone.nameBn)}</h3>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-white/50">
                        {t("dayWindow", { start: milestone.dayStart, end: milestone.dayEnd })}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs ${statusTone[status]}`}>
                        {t(`status.${status}`)}
                      </span>
                    </span>
                  </header>

                  <p className="mt-1 text-xs text-white/50">
                    {t("milestoneProgress", { done: milestone.doneTasks, total: milestone.totalTasks })}
                  </p>

                  <ul className="mt-3 space-y-1">
                    {milestone.tasks.map((task) => {
                      const title = pickName(task.title, task.titleBn);
                      return (
                        <li key={task.id}>
                          <label
                            title={task.description ?? undefined}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-white/5"
                          >
                            <span className={`flex-1 text-sm ${task.isDone ? "text-white/40 line-through" : ""}`}>
                              {title}
                            </span>

                            {task.dueDate && (
                              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/55">
                                {formatDay(locale, task.dueDate)}
                              </span>
                            )}

                            <input
                              type="checkbox"
                              checked={task.isDone}
                              onChange={(event) => onToggleTask(task.id, event.target.checked)}
                              className="peer sr-only"
                            />
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/5 transition peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-white">
                              {task.isDone && <CheckIcon className="size-4" />}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}