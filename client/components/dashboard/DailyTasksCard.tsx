"use client";

import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { useRemindersSync } from "@/components/dashboard/RemindersSync";
import { CheckIcon, ClipboardIcon, CloseIcon, LeafIcon, PencilIcon, PlusIcon, SproutIcon } from "@/components/icons";
import ReminderEditForm from "@/components/dashboard/ReminderEditForm";
import { toDateInput, todayDateInput } from "@/lib/cropCycles";
import { cropName } from "@/lib/crops";
import { createReminder, deleteReminder, getReminders, setReminderDone, type Reminder } from "@/lib/reminders";

const inputStyle =
  "min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-green-500";

// Today's list: anything due today or left over from earlier days, plus what was ticked off today
function isOnTodaysList(reminder: Reminder, today: string) {
  const day = toDateInput(reminder.dueDate);
  return reminder.isDone ? day === today : day <= today;
}

// Today's to-do list, kept as reminders on the server. Ticks show instantly, then save;
// a failed save puts the tick back the way it was.
export default function DailyTasksCard() {
  const t = useTranslations("dashboard.tasks");
  const format = useFormatter();
  const locale = useLocale();
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(todayDateInput);
  // Set after a task is added for a later day, since it won't appear in today's list
  const [addedForDay, setAddedForDay] = useState<string | null>(null);
  // `version` goes up when the "Coming up" card edits a reminder, so this list reloads too
  const { notifyChanged, version } = useRemindersSync();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Ignores an older answer that arrives after a newer reload started
    let isCurrent = true;
    getReminders()
      .then((loaded) => isCurrent && setReminders(loaded))
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [version]);

  function handleEdited(saved: Reminder) {
    setReminders((current) => current?.map((task) => (task.id === saved.id ? { ...task, ...saved } : task)) ?? null);
    setEditingId(null);
    // A task moved to a later day leaves this list and belongs in "Coming up"
    notifyChanged();
  }

  const today = todayDateInput();
  const tasks = (reminders ?? []).filter((reminder) => isOnTodaysList(reminder, today));
  const doneCount = tasks.filter((task) => task.isDone).length;
  const progressPercent = tasks.length ? (doneCount / tasks.length) * 100 : 0;

  const markTask = (id: string, isDone: boolean) =>
    setReminders((current) => current?.map((task) => (task.id === id ? { ...task, isDone } : task)) ?? null);

  async function toggleTask(id: string, isDone: boolean) {
    markTask(id, isDone);
    try {
      await setReminderDone(id, isDone);
    } catch {
      markTask(id, !isDone);
    }
  }

  async function removeTask(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteReminder(id);
      setReminders((current) => current?.filter((task) => task.id !== id) ?? null);
      setDeleteFailed(false);
      notifyChanged();
    } catch {
      setDeleteFailed(true);
    }
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    try {
      const created = await createReminder(title, newDate);
      setReminders((current) => [...(current ?? []), created]);
      setAddedForDay(newDate > today ? newDate : null);
      // A task for a later day belongs in "Coming up"; tell it to reload
      notifyChanged();
      setNewTitle("");
      setNewDate(today);
      setIsAdding(false);
    } catch {
      // Keep the form open with the typed title, so the user can try again
    }
  }

  const formatDay = (day: string) => format.dateTime(new Date(day), { day: "numeric", month: "short" });

  return (
    <DashCard className="flex flex-col">
      <CardHeader icon={<ClipboardIcon />} title={t("title")} />

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

      {loadFailed && <p className="mt-6 text-center text-sm text-red-300">{t("loadError")}</p>}
      {!loadFailed && !reminders && <p className="mt-6 text-center text-sm text-white/60">{t("loading")}</p>}
      {reminders && tasks.length === 0 && <p className="mt-6 text-center text-sm text-white/60">{t("empty")}</p>}

      {/* Scrolls inside the card when the list is long; data-lenis-prevent lets the mouse wheel scroll it */}
      <ul data-lenis-prevent className="-mr-2 mt-4 max-h-64 flex-1 space-y-1 overflow-y-auto pr-2">
        {tasks.map(({ id, title, isDone, dueDate, cropCycle }) => {
          const Icon = cropCycle ? SproutIcon : LeafIcon;
          const day = toDateInput(dueDate);
          const isLate = !isDone && day < today;
          const details = [
            cropCycle && cropName(cropCycle.crop, locale),
            isLate && t("lateSince", { date: formatDay(day) }),
          ].filter(Boolean);

          if (editingId === id) {
            return (
              <li key={id} className="py-1">
                <ReminderEditForm
                  reminder={{ id, title, dueDate }}
                  onSaved={handleEdited}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            );
          }

          return (
            <li key={id} className="flex items-center gap-1">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-white/5">
                <Icon className={`size-5 shrink-0 ${isDone ? "text-white/35" : ""}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${isDone ? "text-white/40 line-through" : ""}`}>{title}</span>
                  {details.length > 0 && (
                    <span className={`block text-xs ${isLate ? "text-amber-200" : "text-white/50"}`}>
                      {details.join(" · ")}
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(event) => toggleTask(id, event.target.checked)}
                  className="peer sr-only"
                />
                {/* Custom checkbox look; the real input above stays keyboard accessible */}
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/5 transition peer-checked:border-green-500 peer-checked:bg-green-500 peer-focus-visible:ring-2 peer-focus-visible:ring-white">
                  {isDone && <CheckIcon className="size-4" />}
                </span>
              </label>
              {/* Outside the label, so editing or deleting doesn't also tick the task */}
              <button
                type="button"
                onClick={() => setEditingId(id)}
                aria-label={t("editTask", { title })}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <PencilIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => removeTask(id)}
                aria-label={t("deleteTask", { title })}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-red-300"
              >
                <CloseIcon className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {deleteFailed && <p className="mt-3 text-center text-xs text-red-300">{t("deleteError")}</p>}

      {addedForDay && (
        <p role="status" className="mt-3 text-center text-xs text-emerald-200">
          {t("addedForLater", { date: formatDay(addedForDay) })}
        </p>
      )}

      {isAdding ? (
        <form onSubmit={addTask} className="mt-4 flex flex-col gap-2">
          <label htmlFor="new-task" className="sr-only">
            {t("newTaskLabel")}
          </label>
          <input
            id="new-task"
            autoFocus
            value={newTitle}
            maxLength={120}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setIsAdding(false)}
            placeholder={t("newTaskPlaceholder")}
            className={inputStyle}
          />
          <div className="flex gap-2">
            <label htmlFor="new-task-date" className="sr-only">
              {t("dueDateLabel")}
            </label>
            <input
              id="new-task-date"
              type="date"
              required
              min={today}
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              className={`${inputStyle} flex-1`}
            />
            <button
              type="submit"
              className="rounded-xl bg-brand px-4 text-sm font-medium transition hover:bg-green-700"
            >
              {t("save")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setAddedForDay(null);
          }}
          className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-white/15 py-3 text-sm transition hover:bg-white/10"
        >
          <PlusIcon className="size-5" />
          {t("add")}
        </button>
      )}
    </DashCard>
  );
}
