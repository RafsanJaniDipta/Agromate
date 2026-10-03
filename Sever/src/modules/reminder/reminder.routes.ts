import { Router } from "express";
import { ReminderController } from "./reminder.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const reminderRouter = Router();

reminderRouter.use(authenticate, farmerOnly);

reminderRouter.post("/", ReminderController.createReminder);
reminderRouter.get("/", ReminderController.getReminders);
reminderRouter.patch("/:id", ReminderController.updateReminder);
reminderRouter.put("/:id", ReminderController.updateReminder);
reminderRouter.delete("/:id", ReminderController.deleteReminder);
