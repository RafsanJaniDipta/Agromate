import { cache } from "react";
import { api } from "@/lib/api";
import { mockDashboard } from "@/lib/mocks/dashboard";
import { normalizeCode } from "@/lib/normalizeCode";
import {
  FIELD_HEALTH_LEVELS,
  TASK_CATEGORIES,
  WEATHER_CONDITIONS,
  type DailyTask,
  type DashboardData,
} from "@/types/dashboard";

// Flip to false once the backend dashboard endpoints are live
const USE_MOCK_DATA = true;

// The server wraps every response as { success, message, data }
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Browser requests send the login cookie along, so the API knows whose farm it is
const withSession: RequestInit = { credentials: "include" };

// Fixes the spelling of a task's category code ("Watering" → "watering")
const normalizeTask = (task: DailyTask): DailyTask => ({
  ...task,
  category: normalizeCode(task.category, TASK_CATEGORIES, "general"),
});

// Fixes the spelling of every fixed code in the response, so the UI can translate them
function normalizeDashboard(data: DashboardData): DashboardData {
  return {
    ...data,
    weather: {
      ...data.weather,
      condition: normalizeCode(data.weather.condition, WEATHER_CONDITIONS, "cloudy"),
    },
    fields: data.fields.map((field) => ({
      ...field,
      health: normalizeCode(field.health, FIELD_HEALTH_LEVELS, "healthy"),
    })),
    tasks: data.tasks.map(normalizeTask),
  };
}

// Everything the dashboard page shows, in one request.
// Runs on the server, so the visitor's cookies are forwarded by hand.
// Wrapped in cache() so the layout and the page share one fetch per request.
export const getDashboard = cache(async (cookieHeader: string): Promise<DashboardData> => {
  if (USE_MOCK_DATA) return normalizeDashboard(mockDashboard);

  const { data } = await api<ApiEnvelope<DashboardData>>("/api/dashboard", {
    headers: { "Content-Type": "application/json", cookie: cookieHeader },
    cache: "no-store", // always show the farm's latest numbers
  });
  return normalizeDashboard(data);
});

// Marks a daily task as done or not done.
export async function setTaskDone(taskId: string, done: boolean): Promise<void> {
  if (USE_MOCK_DATA) return;

  await api(`/api/dashboard/tasks/${taskId}`, {
    ...withSession,
    method: "PATCH",
    body: JSON.stringify({ done }),
  });
}

// Creates a new daily task and returns it with its server id.
export async function createTask(title: string): Promise<DailyTask> {
  if (USE_MOCK_DATA) {
    return { id: crypto.randomUUID(), title, category: "general", done: false };
  }

  const { data } = await api<ApiEnvelope<DailyTask>>("/api/dashboard/tasks", {
    ...withSession,
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return normalizeTask(data);
}
