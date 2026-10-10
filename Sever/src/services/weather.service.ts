import { AppError } from "../utils/AppError.js";
import { districtIn } from "../utils/bdDistricts.js";
import { logger } from "../utils/logger.js";

// Weather from Open-Meteo: free, no API key. https://open-meteo.com/en/docs
// Its free limits are counted per IP address, and hosts like Render share one address between
// many customers, so it can refuse a server that has done nothing wrong. MET Norway (also
// free and keyless) is then asked instead; see getWeatherReport.
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
// https://api.met.no/weatherapi/locationforecast/2.0/documentation
const MET_NORWAY_URL = "https://api.met.no/weatherapi/locationforecast/2.0/complete";
// MET Norway turns away requests that don't say who is calling
const MET_NORWAY_USER_AGENT = "Agromate/1.0 github.com/RafsanJaniDipta/Agromate";
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

async function getJson<T>(url: URL, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).catch(
    (error: Error) => error,
  );
  if (res instanceof Error || !res.ok) {
    // The reason goes to the log, not to the visitor: "HTTP 429" (over the limit) reads very
    // differently from a timeout when working out why weather is missing
    const reason = res instanceof Error ? res.message : `HTTP ${res.status}`;
    logger.warn(`[weather] ${url.hostname} failed: ${reason}`);
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

// Holds only the weather, since two names can share a spot
type Weather = Omit<WeatherReport, "place">;

async function fetchOpenMeteo(place: Place): Promise<Weather> {
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

  return {
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
}

// ---- MET Norway (backup) ----

type MetNorwayPeriod = { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
type MetNorwayResponse = {
  properties: {
    // Hour by hour for about two days, then every six hours; times are UTC
    timeseries: {
      time: string;
      data: {
        instant: {
          details: {
            air_temperature?: number;
            relative_humidity?: number;
            wind_speed?: number; // m/s
            cloud_area_fraction?: number;
            ultraviolet_index_clear_sky?: number;
          };
        };
        next_1_hours?: MetNorwayPeriod;
        next_6_hours?: MetNorwayPeriod & { details?: { air_temperature_max?: number; air_temperature_min?: number } };
      };
    }[];
  };
};

const BANGLADESH_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;
// Hours (Bangladesh time) counted as daytime when describing a day's sky
const DAY_STARTS_AT = 6;
const DAY_ENDS_AT = 18;
// Hours around noon, when the day's UV peaks
const MIDDAY_STARTS_AT = 10;
const MIDDAY_ENDS_AT = 14;
// Less than this in an hour is a trace, not rain
const WET_HOUR_MM = 0.1;
const M_PER_S_TO_KMH = 3.6;

// MET Norway's symbol ("heavyrainandthunder", "partlycloudy_day") as the WMO code the rest of
// this file reads: only storm, rain and fog matter, the sky itself comes from the cloud cover
function wmoCodeOf(symbol = ""): number {
  if (symbol.includes("thunder")) return 95;
  if (/rain|sleet|snow/.test(symbol)) return 61;
  if (symbol.includes("fog")) return 45;
  return 0;
}

const sumOf = <T>(items: T[], value: (item: T) => number) => items.reduce((sum, item) => sum + value(item), 0);

async function fetchMetNorway(place: Place): Promise<Weather> {
  const url = new URL(MET_NORWAY_URL);
  // More than four decimals is refused
  url.search = new URLSearchParams({ lat: place.latitude.toFixed(4), lon: place.longitude.toFixed(4) }).toString();
  const { properties } = await getJson<MetNorwayResponse>(url, { "User-Agent": MET_NORWAY_USER_AGENT });

  // One row per forecast step, in Bangladesh time. A step's rain covers the hours until the
  // next step (1 hour early on, 6 hours later). There is no past data, so "today" only
  // covers what is left of the day: in the evening its high is the evening's, not the afternoon's.
  const steps = properties.timeseries.flatMap(({ time, data }) => {
    const period = data.next_1_hours ?? data.next_6_hours;
    if (!period) return [];

    const local = new Date(new Date(time).getTime() + BANGLADESH_UTC_OFFSET_MS);
    const hours = data.next_1_hours ? 1 : 6;
    const rainMm = period.details?.precipitation_amount ?? 0;
    const { details } = data.instant;
    const sixHours = data.next_6_hours?.details;
    return [
      {
        date: local.toISOString().slice(0, 10),
        isDaytime: local.getUTCHours() >= DAY_STARTS_AT && local.getUTCHours() < DAY_ENDS_AT,
        hours,
        rainMm,
        // A six-hour step with rain counts as wet throughout; there is nothing finer to go on
        wetHours: rainMm >= WET_HOUR_MM * hours ? hours : 0,
        code: wmoCodeOf(period.summary?.symbol_code),
        cloud: details.cloud_area_fraction ?? 0,
        temperatures: [details.air_temperature, sixHours?.air_temperature_max, sixHours?.air_temperature_min].filter(
          (value): value is number => value !== undefined,
        ),
        humidity: details.relative_humidity ?? 0,
        windKmh: (details.wind_speed ?? 0) * M_PER_S_TO_KMH,
        // Only given for the first two or three days
        uv: details.ultraviolet_index_clear_sky,
        isMidday: local.getUTCHours() >= MIDDAY_STARTS_AT && local.getUTCHours() <= MIDDAY_ENDS_AT,
      },
    ];
  });

  const now = steps[0];
  if (!now) {
    throw AppError.badGateway("Weather service sent no forecast");
  }

  // MET Norway has no rain probability outside the Nordic countries, so it is estimated:
  // the share of the hours in which rain is forecast
  type Step = (typeof steps)[number];
  const rainChance = (period: Step[]) => {
    const hours = sumOf(period, (step) => step.hours);
    return hours === 0 ? 0 : Math.round((sumOf(period, (step) => step.wetHours) / hours) * 100);
  };

  // A day's UV is its midday peak. Days without a midday reading (later days, or today when
  // it is already evening) get the week's known peak: clear-sky UV barely moves in a week.
  const weekPeakUv = Math.max(0, ...steps.map((step) => step.uv ?? 0));
  const peakUv = (ofDay: Step[]) => {
    const midday = ofDay.flatMap((step) => (step.isMidday && step.uv !== undefined ? [step.uv] : []));
    return midday.length > 0 ? Math.max(...midday) : weekPeakUv;
  };

  const dates = [...new Set(steps.map((step) => step.date))].slice(0, FORECAST_DAYS);
  return {
    current: {
      temperatureC: Math.round(now.temperatures[0] ?? 0),
      condition: currentCondition(now.code, now.cloud, now.isDaytime),
      humidityPercent: Math.round(now.humidity),
      windKmh: Math.round(now.windKmh),
      uvIndex: Math.round(now.uv ?? 0),
      // Right now looks a few hours ahead, like a forecast would
      rainChancePercent: rainChance(steps.slice(0, 6)),
    },
    days: dates.map((date) => {
      const ofDay = steps.filter((step) => step.date === date);
      const temperatures = ofDay.flatMap((step) => step.temperatures);
      const rainMm = sumOf(ofDay, (step) => step.rainMm);
      return {
        date,
        condition: dayCondition(
          ofDay.map((step) => step.code),
          ofDay.filter((step) => step.isDaytime).map((step) => step.cloud),
          rainMm,
        ),
        maxTempC: Math.round(Math.max(...temperatures)),
        minTempC: Math.round(Math.min(...temperatures)),
        rainfallMm: Math.round(rainMm * 10) / 10,
        rainChancePercent: rainChance(ofDay),
        uvIndex: Math.round(peakUv(ofDay)),
      };
    }),
  };
}

// Keyed by rounded coordinates
const weatherCache = new Map<string, { weather: Weather; fetchedAt: number }>();

// Current weather and the next 7 days for one place (today first).
// Open-Meteo first, MET Norway if it fails; if both fail, the last weather fetched for this
// spot is better than none.
export async function getWeatherReport(place: Place): Promise<WeatherReport> {
  const cacheKey = `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < WEATHER_CACHE_MS) return { place, ...cached.weather };

  try {
    const weather = await fetchOpenMeteo(place).catch(() => fetchMetNorway(place));
    weatherCache.set(cacheKey, { weather, fetchedAt: Date.now() });
    return { place, ...weather };
  } catch (error) {
    if (cached) return { place, ...cached.weather };
    throw error;
  }
}
