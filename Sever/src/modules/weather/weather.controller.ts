import type { Request, Response } from "express";
import { WeatherService } from "./weather.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { location, lat, lon } = req.query;
    const data = await WeatherService.getCurrentWeather(
      typeof location === "string" ? location : undefined,
      typeof lat === "string" ? lat : undefined,
      typeof lon === "string" ? lon : undefined,
    );
    sendSuccess(res, 200, "Current weather fetched successfully", data);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch weather data");
  }
};

const getWeatherForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { location, days } = req.query;
    const data = await WeatherService.getWeatherForecast(
      typeof location === "string" ? location : undefined,
      days ? Number(days) : 7,
    );
    sendSuccess(res, 200, "Weather forecast fetched successfully", data);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch weather forecast");
  }
};

export const WeatherController = {
  getCurrentWeather,
  getWeatherForecast,
};

