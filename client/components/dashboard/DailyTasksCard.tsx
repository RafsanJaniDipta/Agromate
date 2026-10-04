"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import {
  CheckIcon,
  ClipboardIcon,
  CowIcon,
  DropIcon,
  LeafIcon,
  PlusIcon,
  SproutIcon,
  TractorIcon,
} from "@/components/icons";
import { createTask, setTaskDone } from "@/lib/dashboard";
import type { DailyTask, TaskCategory } from "@/types/dashboard";

const categoryIcons: Record<TaskCategory, typeof DropIcon> = {
  watering: DropIcon,
  livestock: CowIcon,
  equipment: TractorIcon,
  soil: SproutIcon,
  general: LeafIcon,
};

type DailyTasksCardProps = {
  initialTasks: DailyTask[];
};

// Today's to-do list with a progress bar. Ticks show instantly, then save to the API;
// a failed save puts the tick back the way it was.
export default function DailyTasksCard({ initialTasks }: DailyTasksCardProps) {
  const t = useTranslations("dashboard.tasks");
  const [tasks, setTasks] = useState(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const doneCount = tasks.filter((task) => task.done).length;
  const progressPercent = tasks.length ? (doneCount / tasks.length) * 100 : 0;

  const markTask = (taskId: string, done: boolean) =>
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, done } : task)));

  async function toggleTask(taskId: string, done: boolean) {
    markTask(taskId, done);
    try {
      await setTaskDone(taskId, done);
    } catch {
      markTask(taskId, !done);
    }
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    try {
      const created = await createTask(title);
      setTasks((current) => [...current, created]);
      setNewTitle("");
      setIsAdding(false);
    } catch {
      // Keep the form open with the typed title, so the user can try again
    }
  }

  return (
    <DashCard className="flex flex-col">
      <CardHeader icon={<ClipboardIcon />} title={t("title")} href="#" />

      <div className="mt-4 border-t border-white/10 pt-4 text-center text-sm">
        <p>
          {t.rich("progress", {
            done: doneCount,
            total: tasks.length,
            highlight: (chunks) => <span className="text-green-400">{chunks}</span>,
          })}
        </p>
        <div
          role="progressbar"
          aria-label={t("title")}
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-green-500 transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {tasks.length === 0 && <p className="mt-6 text-center text-sm text-white/60">{t("empty")}</p>}

      {/* Scrolls inside the card when the list is long; data-lenis-prevent lets the mouse wheel scroll it */}
      <ul data-lenis-prevent className="-mr-2 mt-4 max-h-64 flex-1 space-y-1 overflow-y-auto pr-2">
        {tasks.map(({ id, title, category, done }) => {
          const Icon = categoryIcons[category];
          return (
            <li key={id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-white/5">
                <Icon className={`size-5 shrink-0 ${done ? "text-white/35" : ""}`} />
                <span className={`flex-1 text-sm ${done ? "text-white/40 line-through" : ""}`}>
                  {title}
                </span>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={(event) => toggleTask(id, event.target.checked)}
                  className="peer sr-only"
                />
                {/* Custom checkbox look; the real input above stays keyboard accessible */}
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/5 transition peer-checked:border-green-500 peer-checked:bg-green-500 peer-focus-visible:ring-2 peer-focus-visible:ring-white">
                  {done && <CheckIcon className="size-4" />}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {isAdding ? (
        <form onSubmit={addTask} className="mt-4 flex gap-2">
          <label htmlFor="new-task" className="sr-only">
            {t("newTaskLabel")}
          </label>
          <input
            id="new-task"
            autoFocus
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setIsAdding(false)}
            placeholder={t("newTaskPlaceholder")}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-green-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand px-4 text-sm font-medium transition hover:bg-green-700"
          >
            {t("save")}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-white/15 py-3 text-sm transition hover:bg-white/10"
        >
          <PlusIcon className="size-5" />
          {t("add")}
        </button>
      )}
    </DashCard>
  );
}
