import { Router } from "express";
import { WeatherController } from "./weather.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const weatherRouter = Router();

weatherRouter.use(authenticate);

weatherRouter.get("/current", WeatherController.getCurrentWeather);
weatherRouter.get("/forecast", WeatherController.getWeatherForecast);
