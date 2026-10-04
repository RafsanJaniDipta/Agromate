// Response shape of GET /api/dashboard (inside the server's { success, message, data } envelope).
// This file is the contract with the backend: keep it in sync with the API.
// Dates are ISO strings, numbers are raw values (the UI formats units and currency).

// Fixed codes the UI translates. The API should send them exactly as written here,
// but case, spaces, "_" and "-" are forgiven (see lib/normalizeCode.ts).
export const WEATHER_CONDITIONS = ["sunny", "partlyCloudy", "cloudy", "rainy", "stormy"] as const;
export const FIELD_HEALTH_LEVELS = ["healthy", "attention", "critical"] as const;
export const TASK_CATEGORIES = ["watering", "livestock", "equipment", "soil", "general"] as const;

export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

export type WeatherSummary = {
  date: string; // ISO date, e.g. "2026-05-26"
  temperatureC: number;
  condition: WeatherCondition;
  rainfallMm: number;
  windKmh: number;
  uvIndex: number;
};

export type FieldHealth = (typeof FIELD_HEALTH_LEVELS)[number];

export type FieldMarker = {
  id: string;
  name: string;
  health: FieldHealth;
  // Marker position on the map image, in percent (0–100) from the top-left corner
  position: { x: number; y: number };
};

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type DailyTask = {
  id: string;
  title: string;
  category: TaskCategory;
  done: boolean;
};

export type YieldStat = {
  totalTonnes: number;
  changePercent: number; // vs last week, e.g. 12.4 or -3.1
  trend: number[]; // recent values, oldest first, for the sparkline
};

export type WaterUsageStat = {
  usedCubicMeters: number;
  dailyLimitCubicMeters: number;
};

export type EquipmentStat = {
  total: number;
  working: number;
  maintenance: number;
};

export type RevenueStat = {
  amount: number;
  currency: string; // ISO 4217 code, e.g. "BDT"
  changePercent: number; // vs last month
  trend: number[];
};

export type HarvestMonth = {
  month: number; // 1 = January … 12 = December
  actualTonnes: number | null; // null for months that haven't happened yet
  targetTonnes: number;
};

export type DashboardData = {
  weather: WeatherSummary;
  fields: FieldMarker[];
  tasks: DailyTask[];
  stats: {
    yield: YieldStat;
    water: WaterUsageStat;
    equipment: EquipmentStat;
    revenue: RevenueStat;
  };
  harvest: HarvestMonth[];
  unreadNotifications: number;
};
