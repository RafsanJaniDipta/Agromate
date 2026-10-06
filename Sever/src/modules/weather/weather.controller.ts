import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  getCurrentWeather as getCurrentWeatherService,
  getWeatherForecast as getWeatherForecastService,
  getWeatherHistory as getWeatherHistoryService,
} from "./weather.service.js";

export const getCurrentWeather = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { location, lat, lon } = req.query;
  const data = await getCurrentWeatherService(
    typeof location === "string" ? location : undefined,
    typeof lat === "string" ? lat : undefined,
    typeof lon === "string" ? lon : undefined,
  );
  sendSuccess(res, 200, "Current weather fetched successfully", data);
});

export const getWeatherForecast = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { location, days } = req.query;
  const data = await getWeatherForecastService(
    typeof location === "string" ? location : undefined,
    days ? Number(days) : 7,
  );
  sendSuccess(res, 200, "Weather forecast fetched successfully", data);
});

export const getWeatherHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { location, days } = req.query;
  const data = await getWeatherHistoryService(
    typeof location === "string" ? location : undefined,
    days ? Number(days) : 30,
  );
  sendSuccess(res, 200, "Past weather fetched successfully", data);
});

export const WeatherController = {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherHistory,
};
