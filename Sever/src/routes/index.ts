import { Router } from "express";

import { healthRouter } from "../modules/health/health.routes.js";
import { userRouter } from "../modules/user/user.routes.js";
import { farmRouter } from "../modules/farm/farm.routes.js";
import { fieldRouter } from "../modules/field/field.routes.js";
import { cropRouter } from "../modules/crop/crop.routes.js";
import { cropCycleRouter } from "../modules/cropCycle/cropCycle.routes.js";
import { expenseRouter } from "../modules/expense/expense.routes.js";
import { harvestRouter } from "../modules/harvest/harvest.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { weatherRouter } from "../modules/weather/weather.routes.js";
import { notificationRouter } from "../modules/notification/notification.routes.js";
import { expertRouter } from "../modules/expert/expert.routes.js";
import { aiRouter } from "../modules/aiAssistant/ai.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { reminderRouter } from "../modules/reminder/reminder.routes.js";
import { supportRouter } from "../modules/support/support.routes.js";
import { successStoryRouter } from "../modules/successStory/successStory.routes.js";
import { diseaseDetectionRouter } from "../modules/diseaseDetection/diseaseDetection.routes.js";
import { chatRouter } from "../modules/chat/chat.routes.js";
import { priceRouter } from "../modules/price/price.routes.js";
import { cropRecommendationRouter } from "../modules/cropRecommendation/cropRecommendation.routes.js";
import { fertilizerRecommendationRouter } from "../modules/fertilizerRecommendation/fertilizerRecommendation.routes.js";
import { farmReportRouter } from "../modules/farmReport/farmReport.routes.js";

export const routes = Router();

routes.use("/health", healthRouter);
routes.use("/users", userRouter);
routes.use("/farms", farmRouter);
routes.use("/fields", fieldRouter);
routes.use("/crops", cropRouter);
routes.use("/crop-cycles", cropCycleRouter);
routes.use("/reminders", reminderRouter);
routes.use("/expenses", expenseRouter);
routes.use("/harvests", harvestRouter);
routes.use("/dashboard", dashboardRouter);
routes.use("/weather", weatherRouter);
routes.use("/notifications", notificationRouter);
routes.use("/experts", expertRouter);
routes.use("/ai", aiRouter);
routes.use("/admin", adminRouter);
routes.use("/support", supportRouter);
routes.use("/success-stories", successStoryRouter);
routes.use("/chat", chatRouter);
routes.use("/prices", priceRouter);
routes.use("/crop-recommendations", cropRecommendationRouter);
routes.use("/fertilizer-recommendations", fertilizerRecommendationRouter);
routes.use("/farm-reports", farmReportRouter);
routes.use("/disease-detections", diseaseDetectionRouter);



