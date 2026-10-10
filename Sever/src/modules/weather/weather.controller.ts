import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { DISTRICT_NAMES } from "../../utils/bdDistricts.js";
import {
  getCurrentWeather as getCurrentWeatherService,
  getPublicWeather as getPublicWeatherService,
  getWeatherForecast as getWeatherForecastService,
  locatePlace as locatePlaceService,
  type WeatherQuery,
} from "./weather.service.js";

// ?location=… or ?lat=…&lon=…; without either, the signed-in user's own location is used
function readQuery(req: Request): WeatherQuery {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { location, lat, lon } = req.query;
  return {
    userId,
    location: typeof location === "string" && location.trim() ? location : undefined,
    lat: typeof lat === "string" ? Number(lat) : undefined,
    lon: typeof lon === "string" ? Number(lon) : undefined,
  };
}

export const getCurrentWeather = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await getCurrentWeatherService(readQuery(req));
  sendSuccess(res, 200, "Current weather fetched successfully", data);
});

export const getWeatherForecast = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { days } = req.query;
  const data = await getWeatherForecastService(readQuery(req), days ? Number(days) : 7);
  sendSuccess(res, 200, "Weather forecast fetched successfully", data);
});

// ?location=… → coordinates for opening a map there (the user's own place when left out)
export const locatePlace = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await locatePlaceService(readQuery(req));
  sendSuccess(res, 200, "Place located successfully", data);
});

// Public, for the home page: ?lat=…&lon=… from the visitor's browser; Dhaka when left out
export const getPublicWeather = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { lat, lon } = req.query;
  // NaN (a missing or malformed number) fails the range check in the service
  const data = await getPublicWeatherService(
    typeof lat === "string" ? Number(lat) : undefined,
    typeof lon === "string" ? Number(lon) : undefined,
  );
  sendSuccess(res, 200, "Weather fetched successfully", data);
});

// Bangladesh's 64 districts, for a location picker; either name works as ?location=
export const getDistricts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const districts = Object.entries(DISTRICT_NAMES).map(([nameBn, nameEn]) => ({ nameBn, nameEn }));
  sendSuccess(res, 200, "Districts fetched successfully", districts);
});

export const WeatherController = {
  getCurrentWeather,
  getWeatherForecast,
  getDistricts,
  getPublicWeather,
  locatePlace,
};
