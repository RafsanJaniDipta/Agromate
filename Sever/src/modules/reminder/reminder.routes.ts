import { Router } from "express";
import {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
} from "./reminder.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const reminderRouter = Router();

reminderRouter.use(authenticate, farmerOnly);

reminderRouter.post("/", createReminder);
reminderRouter.get("/", getReminders);
reminderRouter.patch("/:id", updateReminder);
reminderRouter.put("/:id", updateReminder);
reminderRouter.delete("/:id", deleteReminder);
