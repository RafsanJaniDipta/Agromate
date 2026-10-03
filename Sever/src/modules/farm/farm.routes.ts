import { Router } from "express";
import { FarmController } from "./farm.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const farmRouter = Router();

farmRouter.use(authenticate, farmerOnly);

farmRouter.post("/", FarmController.createFarm);
farmRouter.get("/", FarmController.getFarms);
farmRouter.get("/:id", FarmController.getFarmById);
farmRouter.patch("/:id", FarmController.updateFarm);
farmRouter.put("/:id", FarmController.updateFarm);
farmRouter.delete("/:id", FarmController.deleteFarm);

farmRouter.post("/:farmId/fields", FarmController.createFieldForFarm);
farmRouter.get("/:farmId/fields", FarmController.getFieldsForFarm);

