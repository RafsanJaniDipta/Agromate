import { AppError } from "../../utils/AppError.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { env, isProduction } from "../../config/env.js";

/**
 * WeatherAPI.com client (Irfan — external APIs).
 *
 * Three endpoints, matching the spec:
 *   1. current  — real-time conditions
 *   2. forecast — next N days (default 7)
 *   3. history  — past N days of observed weather (default 30)
 *
 * Fallback policy (per requirement: "if not possible, use dummy data for
 * first view as testing"):
 *   - No/invalid key, quota exceeded, or upstream failure -> return a
 *     clearly-flagged SAMPLE payload (`source: "sample"`) in development so
 *     the UI always renders. The frontend should show a "sample data" badge.
 *   - In production the same failures throw a 502 — never serve fake data
 *     to real users.
 *   - Client mistakes (bad params, unknown location) always surface as
 *     400/404 even in development — sample data would hide a typo.
 *
 * The current WeatherAPI key in .env is rejected by the provider (error 2006,
 * "API key is invalid"), so these endpoints currently return sample data until
 * a valid key is pasted in.
 */

const API_BASE = "https://api.weatherapi.com/v1";
const WEATHER_TIMEOUT_MS = 10_000;
const BN_LANG = "bn"; // Bangla condition text, matches the app's bn locale

/** Condition vocabulary the client translates (`client/types/dashboard.ts`). */
export type WeatherCondition = "sunny" | "partlyCloudy" | "cloudy" | "rainy" | "stormy";

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
  timezone: string;
}

export interface CurrentWeather {
  source: "live" | "sample";
  location: WeatherLocation;
  current: {
    observedAt: string;
    temperatureC: number;
    feelsLikeC: number;
    condition: WeatherCondition;
    conditionCode: number;
    conditionText: string;
    humidity: number;
    pressureMb: number;
    windKmh: number;
    windDir: string;
    gustKmh: number;
    precipMm: number;
    uvIndex: number;
    visibilityKm: number;
    cloud: number;
  };
}

export interface ForecastDay {
  date: string;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  condition: WeatherCondition;
  conditionCode: number;
  conditionText: string;
  precipMm: number;
  chanceOfRain: number;
  avgHumidity: number;
  maxWindKmh: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  hours: Array<{
    time: string;
    temperatureC: number;
    condition: WeatherCondition;
    precipMm: number;
    chanceOfRain: number;
    windKmh: number;
    humidity: number;
    dewPointC: number;
  }>;
}

export interface WeatherForecast {
  source: "live" | "sample";
  location: WeatherLocation;
  forecast: ForecastDay[];
}

export interface HistoryDay {
  date: string;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  condition: WeatherCondition;
  conditionCode: number;
  conditionText: string;
  precipMm: number;
  avgHumidity: number;
  maxWindKmh: number;
  uvIndex: number;
}

export interface WeatherHistory {
  source: "live" | "sample";
  location: WeatherLocation;
  history: HistoryDay[];
}

// ---------------------------------------------------------------------------
// Small in-memory cache. Weather barely changes — a single process on Render
// does not need Redis. Current: 15 min, forecast: 6 h, history: 24 h.
// ---------------------------------------------------------------------------
const cache = new Map<string, { expires: number; value: unknown }>();

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

// ---------------------------------------------------------------------------
// WeatherAPI transport + error mapping
// ---------------------------------------------------------------------------
async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}/${path}.json`);
  url.searchParams.set("key", env.WEATHER_API_KEY);
  url.searchParams.set("lang", BN_LANG);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = (await res.json()) as { error?: { code?: number; message?: string } } & T;
    if (!res.ok || body.error) {
      throw weatherApiError(body.error?.code, body.error?.message);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function weatherApiError(code?: number, message?: string): AppError {
  switch (code) {
    case 1006:
      return AppError.notFound(message || "Location not found. Try a city name or lat,lon.");
    case 1002:
    case 1003:
    case 1005:
      return AppError.badRequest(message || "Bad request to the weather service");
    case 2006:
      return AppError.badGateway("Weather API key is invalid (2006). Check WEATHER_API_KEY in .env");
    case 2007:
      return AppError.badGateway("Weather API monthly quota exceeded (2007)");
    default:
      return AppError.badGateway(message || "Weather service unavailable");
  }
}

/**
 * Runs the live call, falling back to sample data in development when the
 * failure is upstream (bad key, quota, network). Client errors (400/404) and
 * all production failures are thrown.
 */
async function withFallback<T>(op: () => Promise<T>, sample: () => T): Promise<T> {
  if (!env.WEATHER_API_KEY.trim()) {
    if (!isProduction) return sample();
    throw AppError.badGateway("WEATHER_API_KEY is not configured");
  }
  try {
    return await op();
  } catch (error) {
    if (error instanceof AppError && (error.statusCode === 400 || error.statusCode === 404)) {
      throw error;
    }
    if (isProduction) throw error;
    return sample();
  }
}

// ---------------------------------------------------------------------------
// Response mapping
// ---------------------------------------------------------------------------
type RawLocation = {
  name?: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
  localtime?: string;
  tz_id?: string;
};

type RawCondition = { code?: number; text?: string };

type RawForecastDay = {
  date?: string;
  day?: {
    maxtemp_c?: number;
    mintemp_c?: number;
    avgtemp_c?: number;
    totalprecip_mm?: number;
    daily_chance_of_rain?: number;
    avghumidity?: number;
    maxwind_kph?: number;
    uv?: number;
    condition?: RawCondition;
  };
  astro?: { sunrise?: string; sunset?: string };
  hour?: Array<{
    time?: string;
    temp_c?: number;
    humidity?: number;
    precip_mm?: number;
    chance_of_rain?: number;
    wind_kph?: number;
    dewpoint_c?: number;
    condition?: RawCondition;
  }>;
};

type RawCurrentBody = {
  location?: RawLocation;
  current?: {
    last_updated?: string;
    temp_c?: number;
    feelslike_c?: number;
    humidity?: number;
    pressure_mb?: number;
    wind_kph?: number;
    wind_dir?: string;
    gust_kph?: number;
    precip_mm?: number;
    uv_index?: number;
    vis_km?: number;
    cloud?: number;
    condition?: RawCondition;
  };
};

type RawForecastBody = { location?: RawLocation; forecast?: { forecastday?: RawForecastDay[] } };

function toCondition(code?: number, text?: string): WeatherCondition {
  if (typeof code === "number") {
    if (code === 1087 || (code >= 1273 && code <= 1276)) return "stormy"; // thunder
    if (code === 1000) return "sunny";
    if (code === 1003) return "partlyCloudy";
    if ((code >= 1006 && code <= 1009) || code === 1030 || code === 1135 || code === 1147) {
      return "cloudy"; // overcast / mist / fog / freezing fog
    }
    return "rainy"; // every other code is some form of precipitation
  }
  const t = (text ?? "").toLowerCase();
  if (t.includes("thunder")) return "stormy";
  if (t.includes("sunny") || t.includes("clear")) return "sunny";
  if (t.includes("partly")) return "partlyCloudy";
  if (t.includes("cloud") || t.includes("fog") || t.includes("mist")) return "cloudy";
  return "rainy";
}

function mapLocation(loc: RawLocation): WeatherLocation {
  return {
    name: loc.name ?? "Unknown",
    region: loc.region ?? "",
    country: loc.country ?? "",
    lat: Number(loc.lat ?? 0),
    lon: Number(loc.lon ?? 0),
    localtime: loc.localtime ?? "",
    timezone: loc.tz_id ?? "",
  };
}

function mapCurrentBody(raw: RawCurrentBody): CurrentWeather {
  const c = raw.current ?? {};
  return {
    source: "live",
    location: mapLocation(raw.location ?? {}),
    current: {
      observedAt: c.last_updated ?? new Date().toISOString(),
      temperatureC: Number(c.temp_c ?? 0),
      feelsLikeC: Number(c.feelslike_c ?? c.temp_c ?? 0),
      condition: toCondition(c.condition?.code, c.condition?.text),
      conditionCode: Number(c.condition?.code ?? -1),
      conditionText: c.condition?.text ?? "",
      humidity: Number(c.humidity ?? 0),
      pressureMb: Number(c.pressure_mb ?? 0),
      windKmh: Number(c.wind_kph ?? 0),
      windDir: c.wind_dir ?? "",
      gustKmh: Number(c.gust_kph ?? 0),
      precipMm: Number(c.precip_mm ?? 0),
      uvIndex: Number(c.uv_index ?? 0),
      visibilityKm: Number(c.vis_km ?? 0),
      cloud: Number(c.cloud ?? 0),
    },
  };
}

function mapForecastBody(raw: RawForecastBody): WeatherForecast {
  const days = raw.forecast?.forecastday ?? [];

  return {
    source: "live",
    location: mapLocation(raw.location ?? {}),
    forecast: days.map((d) => ({
      date: d.date ?? "",
      maxTempC: Number(d.day?.maxtemp_c ?? 0),
      minTempC: Number(d.day?.mintemp_c ?? 0),
      avgTempC: Number(d.day?.avgtemp_c ?? 0),
      condition: toCondition(d.day?.condition?.code, d.day?.condition?.text),
      conditionCode: Number(d.day?.condition?.code ?? -1),
      conditionText: d.day?.condition?.text ?? "",
      precipMm: Number(d.day?.totalprecip_mm ?? 0),
      chanceOfRain: Number(d.day?.daily_chance_of_rain ?? 0),
      avgHumidity: Number(d.day?.avghumidity ?? 0),
      maxWindKmh: Number(d.day?.maxwind_kph ?? 0),
      uvIndex: Number(d.day?.uv ?? 0),
      sunrise: d.astro?.sunrise ?? "",
      sunset: d.astro?.sunset ?? "",
      hours: (d.hour ?? []).map((h) => ({
        time: h.time ?? "",
        temperatureC: Number(h.temp_c ?? 0),
        condition: toCondition(h.condition?.code, h.condition?.text),
        precipMm: Number(h.precip_mm ?? 0),
        chanceOfRain: Number(h.chance_of_rain ?? 0),
        windKmh: Number(h.wind_kph ?? 0),
        humidity: Number(h.humidity ?? 0),
        dewPointC: Number(h.dewpoint_c ?? 0),
      })),
    })),
  };
}

function mapHistoryBody(raw: RawForecastBody): WeatherHistory {
  const days = raw.forecast?.forecastday ?? [];

  return {
    source: "live",
    location: mapLocation(raw.location ?? {}),
    history: days.map((d) => ({
      date: d.date ?? "",
      maxTempC: Number(d.day?.maxtemp_c ?? 0),
      minTempC: Number(d.day?.mintemp_c ?? 0),
      avgTempC: Number(d.day?.avgtemp_c ?? 0),
      condition: toCondition(d.day?.condition?.code, d.day?.condition?.text),
      conditionCode: Number(d.day?.condition?.code ?? -1),
      conditionText: d.day?.condition?.text ?? "",
      precipMm: Number(d.day?.totalprecip_mm ?? 0),
      avgHumidity: Number(d.day?.avghumidity ?? 0),
      maxWindKmh: Number(d.day?.maxwind_kph ?? 0),
      uvIndex: Number(d.day?.uv ?? 0),
    })),
  };
}

// ---------------------------------------------------------------------------
// Sample (fallback) generators — deterministic per date so the UI doesn't
// flicker on re-render. Clearly flagged with source: "sample".
// ---------------------------------------------------------------------------
const SAMPLE_LOCATION = (name: string): WeatherLocation => ({
  name,
  region: "Dhaka",
  country: "Bangladesh",
  lat: 23.8103,
  lon: 90.4125,
  localtime: new Date().toISOString().slice(0, 16),
  timezone: "Asia/Dhaka",
});

/** Deterministic 0..1 hash of a string — stable for the same date. */
function hashOf(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h / 4294967295;
}

function sampleCondition(seed: number): WeatherCondition {
  if (seed < 0.15) return "sunny";
  if (seed < 0.4) return "partlyCloudy";
  if (seed < 0.65) return "cloudy";
  if (seed < 0.9) return "rainy";
  return "stormy";
}

function sampleCurrent(location?: string, lat?: string, lon?: string): CurrentWeather {
  const name = location || "Dhaka";
  const seed = hashOf(new Date().toISOString().slice(0, 10) + name);
  const condition = sampleCondition(seed);
  const temp = 24 + seed * 8; // October Dhaka: 24-32 °C
  return {
    source: "sample",
    location: SAMPLE_LOCATION(name),
    current: {
      observedAt: new Date().toISOString(),
      temperatureC: Math.round(temp * 10) / 10,
      feelsLikeC: Math.round((temp + 2 + seed) * 10) / 10,
      condition,
      conditionCode: -1,
      conditionText: "",
      humidity: Math.round(60 + seed * 25),
      pressureMb: Math.round(1004 + seed * 10),
      windKmh: Math.round(6 + seed * 12),
      windDir: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(seed * 8)] ?? "S",
      gustKmh: Math.round(12 + seed * 18),
      precipMm: condition === "rainy" || condition === "stormy" ? Math.round(2 + seed * 22) : 0,
      uvIndex: condition === "sunny" ? 7 : condition === "partlyCloudy" ? 5 : 3,
      visibilityKm: condition === "cloudy" || condition === "rainy" ? 6 : 10,
      cloud: condition === "sunny" ? 10 : condition === "partlyCloudy" ? 40 : condition === "cloudy" ? 80 : 95,
    },
  };
}

function sampleForecast(location?: string, days = 7): WeatherForecast {
  const name = location || "Dhaka";
  const today = new Date();
  const forecast: ForecastDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const seed = hashOf(iso + name);
    const condition = sampleCondition(seed);
    const max = 27 + seed * 7; // 27-34
    const min = 21 + seed * 6; // 21-27

    const hours = Array.from({ length: 24 }, (_, hour) => {
      // daily curve: coldest ~6am, hottest ~2pm
      const curve = -Math.cos(((hour - 6) / 24) * 2 * Math.PI) * 3.5;
      const rainHour = (condition === "rainy" || condition === "stormy") && hour % 6 === 0;
      return {
        time: `${iso} ${String(hour).padStart(2, "0")}:00`,
        temperatureC: Math.round((min + (max - min) * (curve + 3.5) / 7) * 10) / 10,
        condition,
        precipMm: rainHour ? Math.round(1 + seed * 8) : 0,
        chanceOfRain:
          condition === "rainy" ? Math.round(50 + seed * 45) : condition === "stormy" ? 80 : Math.round(seed * 25),
        windKmh: Math.round(5 + seed * 12),
        humidity: Math.round(60 + (1 - seed) * 30),
        dewPointC: Math.round(min + 2 + seed * 3),
      };
    });

    forecast.push({
      date: iso,
      maxTempC: Math.round(max * 10) / 10,
      minTempC: Math.round(min * 10) / 10,
      avgTempC: Math.round(((max + min) / 2) * 10) / 10,
      condition,
      conditionCode: -1,
      conditionText: "",
      precipMm: condition === "rainy" || condition === "stormy" ? Math.round(5 + seed * 40) : Math.round(seed * 4),
      chanceOfRain:
        condition === "rainy" ? Math.round(55 + seed * 40) : condition === "stormy" ? 85 : Math.round(seed * 30),
      avgHumidity: Math.round(60 + (1 - seed) * 30),
      maxWindKmh: Math.round(8 + seed * 18),
      uvIndex: condition === "sunny" ? 8 : condition === "partlyCloudy" ? 6 : 3,
      sunrise: "05:58 AM",
      sunset: "05:43 PM",
      hours,
    });
  }

  return { source: "sample", location: SAMPLE_LOCATION(name), forecast };
}

function sampleHistory(location?: string, days = 30): WeatherHistory {
  const name = location || "Dhaka";
  const today = new Date();
  const history: HistoryDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    const seed = hashOf(iso + name);
    const condition = sampleCondition(seed);
    const max = 27 + seed * 7;
    const min = 21 + seed * 6;

    history.push({
      date: iso,
      maxTempC: Math.round(max * 10) / 10,
      minTempC: Math.round(min * 10) / 10,
      avgTempC: Math.round(((max + min) / 2) * 10) / 10,
      condition,
      conditionCode: -1,
      conditionText: "",
      precipMm: condition === "rainy" || condition === "stormy" ? Math.round(4 + seed * 48) : Math.round(seed * 5),
      avgHumidity: Math.round(60 + (1 - seed) * 32),
      maxWindKmh: Math.round(7 + seed * 20),
      uvIndex: condition === "sunny" ? 8 : condition === "partlyCloudy" ? 6 : 3,
    });
  }

  return { source: "sample", location: SAMPLE_LOCATION(name), history };
}

// ---------------------------------------------------------------------------
// Public service functions (wrapped for consistent error handling/types)
// ---------------------------------------------------------------------------
function resolveQ(location?: string, lat?: string, lon?: string): string {
  if (location && location.trim()) return location.trim();
  if (lat && lon && lat.trim() && lon.trim()) return `${lat.trim()},${lon.trim()}`;
  throw AppError.unprocessable("Provide a location (city name) or lat & lon query parameters");
}

export const getCurrentWeather = serviceHandler(async (location?: string, lat?: string, lon?: string) => {
  return withFallback(
    async () => {
      const q = resolveQ(location, lat, lon);
      return cached(`current:${q}`, 15 * 60_000, () =>
        get<RawCurrentBody>("current", { q, aqi: "yes" }).then(mapCurrentBody),
      );
    },
    () => sampleCurrent(location, lat, lon),
  );
});

export const getWeatherForecast = serviceHandler(async (location?: string, days: number = 7) => {
  const clamped = Math.min(Math.max(days, 1), 14);
  return withFallback(
    async () => {
      const q = resolveQ(location);
      return cached(`forecast:${q}:${clamped}`, 6 * 60 * 60_000, () =>
        get<RawForecastBody>("forecast", { q, days: clamped, aqi: "yes" }).then(mapForecastBody),
      );
    },
    () => sampleForecast(location, clamped),
  );
});

export const getWeatherHistory = serviceHandler(async (location?: string, days: number = 30) => {
  const clamped = Math.min(Math.max(days, 1), 30);
  return withFallback(
    async () => {
      const q = resolveQ(location);
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date();
      start.setDate(start.getDate() - (clamped - 1));
      const startDate = start.toISOString().slice(0, 10);
      // NOTE: >1 day of history requires a paid WeatherAPI plan. On the free
      // plan this request fails -> sample data in development.
      return cached(`history:${q}:${clamped}`, 24 * 60 * 60_000, () =>
        get<RawForecastBody>("history", { q, dt: startDate, end_dt: today }).then(mapHistoryBody),
      );
    },
    () => sampleHistory(location, clamped),
  );
});

export const WeatherService = {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherHistory,
};