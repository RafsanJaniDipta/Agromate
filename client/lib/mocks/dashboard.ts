import type { DashboardData } from "@/types/dashboard";

// Sample dashboard response, used until GET /api/dashboard is live.
// Also serves as an example payload for the backend team.
export const mockDashboard: DashboardData = {
  weather: {
    date: "2026-05-26",
    temperatureC: 28,
    condition: "cloudy",
    rainfallMm: 2,
    windKmh: 8,
    uvIndex: 4,
  },
  fields: [
    { id: "field-1", name: "Field 1", health: "critical", position: { x: 62, y: 80 } },
    { id: "field-2", name: "Field 2", health: "healthy", position: { x: 46, y: 43 } },
    { id: "field-3", name: "Field 3", health: "attention", position: { x: 22, y: 43 } },
  ],
  tasks: [
    { id: "task-1", title: "Watering Field 3", category: "watering", done: true },
    { id: "task-2", title: "Feeding cattle", category: "livestock", done: false },
    { id: "task-3", title: "Service tractor", category: "equipment", done: false },
    { id: "task-4", title: "Soil testing", category: "soil", done: false },
    { id: "task-5", title: "Watering Field 2", category: "watering", done: false },
    { id: "task-6", title: "Check fertilizer stock", category: "general", done: false },
  ],
  stats: {
    yield: {
      totalTonnes: 142.5,
      changePercent: 12.4,
      trend: [118, 124, 121, 127, 125, 131, 129, 134, 133, 138, 137, 142.5],
    },
    water: { usedCubicMeters: 1240, dailyLimitCubicMeters: 1900 },
    equipment: { total: 5, working: 4, maintenance: 1 },
    revenue: {
      amount: 245600,
      currency: "BDT",
      changePercent: 8.3,
      trend: [198, 205, 201, 214, 210, 219, 222, 218, 229, 233, 238, 245.6],
    },
  },
  harvest: [
    { month: 1, actualTonnes: 18, targetTonnes: 18 },
    { month: 2, actualTonnes: 19, targetTonnes: 20 },
    { month: 3, actualTonnes: 25, targetTonnes: 24 },
    { month: 4, actualTonnes: 27, targetTonnes: 27 },
    { month: 5, actualTonnes: 31, targetTonnes: 30 },
    { month: 6, actualTonnes: null, targetTonnes: 31 },
    { month: 7, actualTonnes: null, targetTonnes: 34 },
    { month: 8, actualTonnes: null, targetTonnes: 35 },
    { month: 9, actualTonnes: null, targetTonnes: 33 },
    { month: 10, actualTonnes: null, targetTonnes: 30 },
    { month: 11, actualTonnes: null, targetTonnes: 26 },
    { month: 12, actualTonnes: null, targetTonnes: 22 },
  ],
  unreadNotifications: 3,
};
