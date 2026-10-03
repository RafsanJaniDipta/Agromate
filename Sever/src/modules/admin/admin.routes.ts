import { Router } from "express";
import {
  getAllUsers,
  updateUserStatus,
  getStatistics,
  getDeliveryAgents,
} from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:id", updateUserStatus);
adminRouter.get("/statistics", getStatistics);
adminRouter.get("/delivery-agents", getDeliveryAgents);
