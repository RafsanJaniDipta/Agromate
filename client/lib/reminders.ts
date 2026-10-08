import { api } from "@/lib/api";
import type { Crop } from "@/lib/crops";

// A to-do with a due date, such as "Spray the tomato field". May belong to one planted crop.
export type Reminder = {
  id: string;
  title: string;
  dueDate: string; // ISO
  note: string | null;
  isDone: boolean;
  cropCycleId: string | null;
  // Only on the list response
  cropCycle?: { crop: Pick<Crop, "name" | "nameBn"> } | null;
};

type Envelope<T> = { data: T };

// All of the farmer's reminders, soonest first
export async function getReminders() {
  const { data } = await api<Envelope<Reminder[]>>("/api/reminders");
  return data;
}

// `dueDate` is "YYYY-MM-DD"
export async function createReminder(title: string, dueDate: string) {
  const { data } = await api<Envelope<Reminder>>("/api/reminders", {
    method: "POST",
    body: JSON.stringify({ title, dueDate }),
  });
  return data;
}

export async function setReminderDone(id: string, isDone: boolean) {
  await api(`/api/reminders/${id}`, { method: "PATCH", body: JSON.stringify({ isDone }) });
}

// Changes the text and/or due date ("YYYY-MM-DD")
export async function updateReminder(id: string, change: { title: string; dueDate: string }) {
  const { data } = await api<Envelope<Reminder>>(`/api/reminders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(change),
  });
  return data;
}

export async function deleteReminder(id: string) {
  await api(`/api/reminders/${id}`, { method: "DELETE" });
}
