import { api } from "@/lib/api";
import type { CropCycle } from "@/lib/cropCycles";
import type { Reminder } from "@/lib/reminders";

// Crops planted or due for harvest, and reminders due, between two "YYYY-MM-DD" dates
export type CalendarEvents = { cropCycles: CropCycle[]; reminders: Reminder[] };

export async function getCalendarEvents(from: string, to: string) {
  const { data } = await api<{ data: CalendarEvents }>(`/api/crop-cycles/calendar?from=${from}&to=${to}`);
  return data;
}
