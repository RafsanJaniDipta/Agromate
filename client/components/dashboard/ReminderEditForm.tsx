"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toDateInput } from "@/lib/cropCycles";
import { updateReminder, type Reminder } from "@/lib/reminders";

const inputStyle =
  "min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-green-500";

type ReminderEditFormProps = {
  reminder: Pick<Reminder, "id" | "title" | "dueDate">;
  onSaved: (reminder: Reminder) => void;
  onCancel: () => void;
};

// Inline form to change a task's text or move it to another day. Used by both task cards.
export default function ReminderEditForm({ reminder, onSaved, onCancel }: ReminderEditFormProps) {
  const t = useTranslations("dashboard.tasks");
  const [title, setTitle] = useState(reminder.title);
  const [dueDate, setDueDate] = useState(toDateInput(reminder.dueDate));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setStatus("saving");
    try {
      onSaved(await updateReminder(reminder.id, { title: title.trim(), dueDate }));
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
      <label htmlFor={`edit-task-${reminder.id}`} className="sr-only">
        {t("newTaskLabel")}
      </label>
      <input
        id={`edit-task-${reminder.id}`}
        autoFocus
        required
        maxLength={120}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className={inputStyle}
      />
      <div className="flex gap-2">
        <label htmlFor={`edit-task-date-${reminder.id}`} className="sr-only">
          {t("dueDateLabel")}
        </label>
        <input
          id={`edit-task-date-${reminder.id}`}
          type="date"
          required
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className={`${inputStyle} flex-1`}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-xl bg-brand px-3 text-sm font-medium transition hover:bg-green-700 disabled:opacity-60"
        >
          {t("saveEdit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/15 px-3 text-sm transition hover:bg-white/10"
        >
          {t("cancelEdit")}
        </button>
      </div>
      {status === "error" && <p className="text-xs text-red-300">{t("editError")}</p>}
    </form>
  );
}
