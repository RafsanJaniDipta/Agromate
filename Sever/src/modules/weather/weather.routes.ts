import { Router } from "express";
import {
  getCurrentWeather,
  getDistricts,
  getPublicWeather,
  getWeatherForecast,
  locatePlace,
} from "./weather.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const weatherRouter = Router();

// Public: the home page shows weather to visitors without an account
weatherRouter.get("/public", getPublicWeather);

// Everything below is about the signed-in user's own places
weatherRouter.use(authenticate);

weatherRouter.get("/current", getCurrentWeather);
weatherRouter.get("/forecast", getWeatherForecast);
weatherRouter.get("/districts", getDistricts);
weatherRouter.get("/locate", locatePlace);
