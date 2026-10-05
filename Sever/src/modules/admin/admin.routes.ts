import { Router } from "express";
import {
  getAllUsers,
  updateUserStatus,
  getStatistics,
  getDeliveryAgents,
  getExpertApplications,
  reviewExpertApplication,
} from "./admin.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";

export const adminRouter = Router();

adminRouter.use(authenticate, adminOnly);

adminRouter.get("/users", getAllUsers);
adminRouter.patch("/users/:id", updateUserStatus);
adminRouter.get("/statistics", getStatistics);
adminRouter.get("/delivery-agents", getDeliveryAgents);
adminRouter.get("/experts", getExpertApplications);
adminRouter.patch("/experts/:userId", reviewExpertApplication);
