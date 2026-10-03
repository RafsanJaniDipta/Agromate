import { Router } from "express";
import { FarmController } from "./farm.controller.js";

export const farmRouter = Router();

farmRouter.post("/", FarmController.createFarm);
farmRouter.get("/", FarmController.getFarms);
farmRouter.get("/:id", FarmController.getFarmById);
farmRouter.put("/:id", FarmController.updateFarm);
farmRouter.delete("/:id", FarmController.deleteFarm);
