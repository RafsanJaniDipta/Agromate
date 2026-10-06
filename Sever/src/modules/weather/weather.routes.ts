import { Router } from "express";
import {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherHistory,
} from "./weather.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const weatherRouter = Router();

weatherRouter.use(authenticate);

weatherRouter.get("/current", getCurrentWeather);
weatherRouter.get("/forecast", getWeatherForecast);
weatherRouter.get("/history", getWeatherHistory);
