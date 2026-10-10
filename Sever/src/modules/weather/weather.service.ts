import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { DHAKA, getWeatherReport, resolvePlace, type Place } from "../../services/weather.service.js";

// Days the public home page shows, today first
const HOME_FORECAST_DAYS = 4;

export interface WeatherQuery {
  userId: string;
  // Free text such as "শিবগঞ্জ, বগুড়া"; overrides the user's own location
  location?: string;
  lat?: number;
  lon?: number;
}

// Where to show weather for: explicit coordinates, then the given location,
// then the user's newest farm, then their profile location, then Dhaka.
async function placeFor({ userId, location, lat, lon }: WeatherQuery): Promise<Place> {
  if (lat !== undefined && lon !== undefined && Number.isFinite(lat) && Number.isFinite(lon)) {
    return { name: location ?? null, latitude: lat, longitude: lon };
  }
  if (location) return resolvePlace(location);

  const [farm, user] = await Promise.all([
    prisma.farm.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { location: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { location: true } }),
  ]);
  // A place address the map search can't find shouldn't hide a usable profile location
  const fromFarm = await resolvePlace(farm?.location);
  return fromFarm.name !== null ? fromFarm : resolvePlace(user?.location);
}

// Today's weather: temperature, sky, chance of rain and UV right now, plus today's rainfall.
// `location` is null when the user's place couldn't be found and Dhaka is shown instead.
export const getCurrentWeather = serviceHandler(async (query: WeatherQuery) => {
  const { place, current, days } = await getWeatherReport(await placeFor(query));
  const today = days[0];
  if (!today) {
    throw AppError.badGateway("Weather service sent no forecast");
  }

  return {
    location: place.name,
    date: today.date,
    temperatureC: current.temperatureC,
    condition: current.condition,
    humidityPercent: current.humidityPercent,
    windKmh: current.windKmh,
    // Rain so far and still expected today; chance of rain and UV are for right now
    rainfallMm: today.rainfallMm,
    // Today's range, so "30° now" isn't mistaken for the 32° the day peaks at
    todayMaxC: today.maxTempC,
    todayMinC: today.minTempC,
    rainChancePercent: current.rainChancePercent,
    uvIndex: current.uvIndex,
  };
});

// Day-by-day forecast, today first (up to 7 days)
export const getWeatherForecast = serviceHandler(async (query: WeatherQuery, days = 7) => {
  const report = await getWeatherReport(await placeFor(query));
  // A bad ?days= falls back to the whole week
  const dayCount = Number.isFinite(days) ? Math.min(Math.max(Math.trunc(days), 1), report.days.length) : 7;
  return { location: report.place.name, days: report.days.slice(0, dayCount) };
});

// Map coordinates for a place (same lookup as the weather), so a map can open there.
// `found` is false when nothing matched and the point is Dhaka.
export const locatePlace = serviceHandler(async (query: WeatherQuery) => {
  const place = await placeFor(query);
  return { latitude: place.latitude, longitude: place.longitude, found: place.name !== null };
});

// Weather for the public home page: at the visitor's coordinates when the browser shared them,
// otherwise Dhaka. Coordinates only, so visitors without an account can't make the server
// look up arbitrary place names.
export const getPublicWeather = serviceHandler(async (lat?: number, lon?: number) => {
  const hasCoordinates =
    lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  const place = hasCoordinates ? { name: null, latitude: lat, longitude: lon } : DHAKA;

  const { current, days } = await getWeatherReport(place);
  if (days.length === 0) {
    throw AppError.badGateway("Weather service sent no forecast");
  }
  return { current, days: days.slice(0, HOME_FORECAST_DAYS) };
});

export const WeatherService = {
  getCurrentWeather,
  getWeatherForecast,
};
