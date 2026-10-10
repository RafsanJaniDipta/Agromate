import { AppError } from "../utils/AppError.js";
import { districtIn } from "../utils/bdDistricts.js";

// Weather from Open-Meteo: free, no API key. https://open-meteo.com/en/docs
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const TIMEZONE = "Asia/Dhaka";
const REQUEST_TIMEOUT_MS = 8000;
// Weather barely changes within this time, so repeat visits reuse the last answer
const WEATHER_CACHE_MS = 10 * 60 * 1000;
const FORECAST_DAYS = 7;

// `name` is the place as the farmer wrote it ("বগুড়া"), so it shows in their own language;
// null means the location couldn't be found and Dhaka's weather is shown instead.
export type Place = { name: string | null; latitude: number; longitude: number };

// Used when a location is missing or can't be found
export const DHAKA: Place = { name: null, latitude: 23.8103, longitude: 90.4125 };

// Fixed codes the client translates (same list as the client's WEATHER_CONDITIONS)
export type WeatherCondition = "sunny" | "clearNight" | "partlyCloudy" | "cloudy" | "rainy" | "stormy";

export type DayForecast = {
  date: string; // "YYYY-MM-DD", Bangladesh time
  condition: WeatherCondition;
  maxTempC: number;
  minTempC: number;
  rainfallMm: number;
  rainChancePercent: number;
  uvIndex: number;
};

export type WeatherReport = {
  place: Place;
  // Right now: these differ from the day's figures (UV peaks at noon, rain may come later)
  current: {
    temperatureC: number;
    condition: WeatherCondition;
    humidityPercent: number;
    windKmh: number;
    uvIndex: number;
    rainChancePercent: number;
  };
  days: DayForecast[];
};

// WMO weather codes (what Open-Meteo sends) that matter here
const isStormCode = (code: number) => code >= 95;
const isRainCode = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
const isFogCode = (code: number) => code === 45 || code === 48;

// WMO counts a day with at least 1 mm of rain as a rainy day; a few drops don't make it one
const RAINY_DAY_MM = 1;
// Cloud cover (%) below which the sky reads as clear, and from which it reads as overcast
const CLEAR_SKY_CLOUD = 25;
const OVERCAST_CLOUD = 70;

function skyFromCloud(cloudPercent: number): WeatherCondition {
  if (cloudPercent < CLEAR_SKY_CLOUD) return "sunny";
  return cloudPercent < OVERCAST_CLOUD ? "partlyCloudy" : "cloudy";
}

// The sky right now. Uses cloud cover rather than the code alone, and never says "sunny" at night.
function currentCondition(code: number, cloudPercent: number, isDay: boolean): WeatherCondition {
  if (isStormCode(code)) return "stormy";
  if (isRainCode(code)) return "rainy";
  if (isFogCode(code)) return "cloudy";
  const sky = skyFromCloud(cloudPercent);
  return sky === "sunny" && !isDay ? "clearNight" : sky;
}

// One word for a whole day. Open-Meteo's daily code is the day's worst hour, so a ten-minute
// drizzle would label a sunny day "rain"; instead: storms win, then real rain, then daytime cloud.
function dayCondition(hourlyCodes: number[], daytimeCloud: number[], rainMm: number): WeatherCondition {
  if (hourlyCodes.some(isStormCode)) return "stormy";
  if (rainMm >= RAINY_DAY_MM) return "rainy";
  if (daytimeCloud.length === 0) return "partlyCloudy";
  return skyFromCloud(daytimeCloud.reduce((sum, cloud) => sum + cloud, 0) / daytimeCloud.length);
}

async function getJson<T>(url: URL): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).catch(() => null);
  if (!res?.ok) {
    throw AppError.badGateway("Weather service is unavailable");
  }
  return (await res.json()) as T;
}

type GeocodeResponse = { results?: { name: string; latitude: number; longitude: number; country_code: string }[] };

// Search results never change, so they're kept for the life of the server
const placeCache = new Map<string, Place | null>();

async function geocode(name: string): Promise<Place | null> {
  if (placeCache.has(name)) return placeCache.get(name)!;

  const url = new URL(GEOCODE_URL);
  url.search = new URLSearchParams({ name, count: "10", language: "en" }).toString();
  const { results = [] } = await getJson<GeocodeResponse>(url);

  // Same names exist in India and Pakistan; only Bangladesh counts
  const hit = results.find((result) => result.country_code === "BD");
  const place = hit ? { name, latitude: hit.latitude, longitude: hit.longitude } : null;
  placeCache.set(name, place);
  return place;
}

// Finds a free-text location such as "শিবগঞ্জ, বগুড়া", "Bogura Sadar" or "Bogura, Rajshahi".
// A known district wins (the first one written, since "district, division" is the usual order);
// otherwise each English part is searched as written. Dhaka if nothing matches.
export async function resolvePlace(location?: string | null): Promise<Place> {
  if (!location?.trim()) return DHAKA;

  const parts = location.split(/[,،।]/).map((part) => part.trim()).filter(Boolean);
  const candidates = [
    ...parts.flatMap((part) => {
      const district = districtIn(part);
      return district ? [{ part, name: district }] : [];
    }),
    // Bangla text the district table doesn't know can't be searched
    ...parts.filter((part) => !/[ঀ-৿]/.test(part)).map((part) => ({ part, name: part })),
  ];

  for (const { part, name } of candidates) {
    // A failed search shouldn't cost the farmer the weather; Dhaka's is better than none
    const place = await geocode(name).catch(() => null);
    if (place) return { ...place, name: part };
  }
  return DHAKA;
}

type ForecastResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    cloud_cover: number;
    is_day: number;
    uv_index: number;
    precipitation_probability: number;
  };
  // Hour by hour, local time ("2026-10-07T15:00"), used to describe each day
  hourly: { time: string[]; weather_code: number[]; cloud_cover: number[]; is_day: number[] };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
  };
};

// Keyed by rounded coordinates; holds only the weather, since two names can share a spot
type Weather = Omit<WeatherReport, "place">;
const weatherCache = new Map<string, { weather: Weather; fetchedAt: number }>();

// Current weather and the next 7 days for one place (today first)
export async function getWeatherReport(place: Place): Promise<WeatherReport> {
  const cacheKey = `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < WEATHER_CACHE_MS) return { place, ...cached.weather };

  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    timezone: TIMEZONE,
    forecast_days: String(FORECAST_DAYS),
    wind_speed_unit: "kmh",
    current:
      "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover,is_day,uv_index,precipitation_probability",
    hourly: "weather_code,cloud_cover,is_day",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max",
  }).toString();
  const { current, hourly, daily } = await getJson<ForecastResponse>(url);

  // Weather codes and daytime cloud cover for one date
  const hoursOf = (date: string) => {
    const indexes = hourly.time.flatMap((time, index) => (time.startsWith(date) ? [index] : []));
    return {
      codes: indexes.map((index) => hourly.weather_code[index] ?? 0),
      daytimeCloud: indexes.filter((index) => hourly.is_day[index] === 1).map((index) => hourly.cloud_cover[index] ?? 0),
    };
  };
  const dayConditionFor = (date: string, rainMm: number) => {
    const { codes, daytimeCloud } = hoursOf(date);
    return dayCondition(codes, daytimeCloud, rainMm);
  };

  const weather: Weather = {
    current: {
      temperatureC: Math.round(current.temperature_2m),
      condition: currentCondition(current.weather_code, current.cloud_cover, current.is_day === 1),
      humidityPercent: Math.round(current.relative_humidity_2m),
      windKmh: Math.round(current.wind_speed_10m),
      uvIndex: Math.round(current.uv_index),
      rainChancePercent: current.precipitation_probability,
    },
    days: daily.time.map((date, index) => ({
      date,
      condition: dayConditionFor(date, daily.precipitation_sum[index] ?? 0),
      // Missing values become 0, so one gap doesn't break the whole forecast
      maxTempC: Math.round(daily.temperature_2m_max[index] ?? 0),
      minTempC: Math.round(daily.temperature_2m_min[index] ?? 0),
      rainfallMm: Math.round((daily.precipitation_sum[index] ?? 0) * 10) / 10,
      rainChancePercent: daily.precipitation_probability_max[index] ?? 0,
      uvIndex: Math.round(daily.uv_index_max[index] ?? 0),
    })),
  };

  weatherCache.set(cacheKey, { weather, fetchedAt: Date.now() });
  return { place, ...weather };
}
