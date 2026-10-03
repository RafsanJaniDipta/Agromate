import { Router } from "express";
import { AdminController } from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.get("/users", AdminController.getAllUsers);
adminRouter.patch("/users/:id", AdminController.updateUserStatus);
adminRouter.get("/statistics", AdminController.getStatistics);
adminRouter.get("/delivery-agents", AdminController.getDeliveryAgents);
