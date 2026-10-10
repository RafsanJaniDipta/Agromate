import { api, API_URL } from "@/lib/api";
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

// ---- Home page (public, no account needed) ----

// Weather for the hero: right now, plus today and the next few days
export type HomeWeather = {
  current: {
    temperatureC: number;
    condition: WeatherCondition;
    humidityPercent: number;
    windKmh: number;
    uvIndex: number;
    rainChancePercent: number;
  };
  // Today first
  days: DayForecast[];
};

const withKnownConditions = (weather: HomeWeather): HomeWeather => ({
  current: { ...weather.current, condition: normalizeCode(weather.current.condition, WEATHER_CONDITIONS, "cloudy") },
  days: weather.days.map((day) => ({
    ...day,
    condition: normalizeCode(day.condition, WEATHER_CONDITIONS, "cloudy"),
  })),
});

// Called on the server: Dhaka's weather, cached for a while, which the hero shows until the
// visitor's own position is known. Null when the API is down, so the page still renders.
export async function getHomeWeather(): Promise<HomeWeather | null> {
  try {
    const res = await fetch(`${API_URL}/api/weather/public`, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return withKnownConditions(((await res.json()) as { data: HomeWeather }).data);
  } catch {
    return null;
  }
}

// Called from the browser once it has shared the visitor's position. Two decimals (about a
// kilometre) is plenty for weather, and keeps the exact spot off the network.
export async function getWeatherAt(lat: number, lon: number) {
  const params = new URLSearchParams({ lat: lat.toFixed(2), lon: lon.toFixed(2) });
  const { data } = await api<{ data: HomeWeather }>(`/api/weather/public?${params}`);
  return withKnownConditions(data);
}

const PLACE_NAME_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const PLACE_NAME_TIMEOUT_MS = 8000;

// The name of the place at this position in the page's language, e.g. "বগুড়া" or
// "শিবগঞ্জ উপজেলা, বগুড়া"; null when it can't be found. BigDataCloud's free endpoint is
// made for this: a browser asking about its own position, no key needed.
export async function getPlaceName(lat: number, lon: number, locale: string): Promise<string | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    localityLanguage: locale,
  });
  try {
    const res = await fetch(`${PLACE_NAME_URL}?${params}`, { signal: AbortSignal.timeout(PLACE_NAME_TIMEOUT_MS) });
    if (!res.ok) return null;
    const place = (await res.json()) as { locality?: string; city?: string };
    return place.locality || place.city || null;
  } catch {
    return null;
  }
}
