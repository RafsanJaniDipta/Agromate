import { api } from "@/lib/api";
import { normalizeCode } from "@/lib/normalizeCode";

// Sky codes the server sends; the UI translates them
// "clearNight" replaces "sunny" after dark
export const WEATHER_CONDITIONS = ["sunny", "clearNight", "partlyCloudy", "cloudy", "rainy", "stormy"] as const;
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

// Whose weather to show. Nothing means the farmer's own place (newest place, then profile location).
export type WeatherQuery =
  | { kind: "own" }
  // Free text such as "শিবগঞ্জ, বগুড়া" or a district name
  | { kind: "place"; location: string }
  // The device's current position
  | { kind: "coords"; lat: number; lon: number };

export type CurrentWeather = {
  // The place as the farmer wrote it ("বগুড়া"); null when it couldn't be found and Dhaka is shown,
  // or when the weather is for coordinates
  location: string | null;
  date: string; // "YYYY-MM-DD"
  // Right now
  temperatureC: number;
  condition: WeatherCondition;
  // Today's high and low
  todayMaxC: number;
  todayMinC: number;
  humidityPercent: number;
  windKmh: number;
  rainfallMm: number;
  rainChancePercent: number;
  uvIndex: number;
};

// One day of the forecast, Bangladesh time
export type DayForecast = {
  date: string; // "YYYY-MM-DD"
  condition: WeatherCondition;
  maxTempC: number;
  minTempC: number;
  rainfallMm: number;
  rainChancePercent: number;
  uvIndex: number;
};

export type District = { nameBn: string; nameEn: string };

// Query string for a WeatherQuery, e.g. "location=বগুড়া" or "lat=24.8&lon=89.3"
function weatherParams(query: WeatherQuery) {
  if (query.kind === "place") return new URLSearchParams({ location: query.location });
  if (query.kind === "coords") return new URLSearchParams({ lat: String(query.lat), lon: String(query.lon) });
  return new URLSearchParams();
}

const ownPlace: WeatherQuery = { kind: "own" };

export async function getCurrentWeather(query = ownPlace) {
  const { data } = await api<{ data: CurrentWeather }>(`/api/weather/current?${weatherParams(query)}`);
  return { ...data, condition: normalizeCode(data.condition, WEATHER_CONDITIONS, "cloudy") };
}

// The next 7 days, today first
export async function getWeatherForecast(query = ownPlace) {
  const params = weatherParams(query);
  params.set("days", "7");
  const { data } = await api<{ data: { location: string | null; days: DayForecast[] } }>(
    `/api/weather/forecast?${params}`,
  );
  return data.days.map((day) => ({
    ...day,
    condition: normalizeCode(day.condition, WEATHER_CONDITIONS, "cloudy"),
  }));
}

// Bangladesh's 64 districts, for picking a place to see weather for
export async function getDistricts() {
  const { data } = await api<{ data: District[] }>("/api/weather/districts");
  return data;
}
