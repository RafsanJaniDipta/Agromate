import { Router } from "express";
import {
  createHarvest,
  getHarvests,
  getHarvestById,
  updateHarvest,
  deleteHarvest,
} from "./harvest.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const harvestRouter = Router();

harvestRouter.use(authenticate, farmerOnly);

harvestRouter.post("/", createHarvest);
harvestRouter.get("/", getHarvests);
harvestRouter.get("/:id", getHarvestById);
harvestRouter.patch("/:id", updateHarvest);
harvestRouter.put("/:id", updateHarvest);
harvestRouter.delete("/:id", deleteHarvest);

