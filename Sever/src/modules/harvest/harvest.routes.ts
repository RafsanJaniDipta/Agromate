import { Router } from "express";
import { HarvestController } from "./harvest.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const harvestRouter = Router();

harvestRouter.use(authenticate, farmerOnly);

harvestRouter.post("/", HarvestController.createHarvest);
harvestRouter.get("/", HarvestController.getHarvests);
harvestRouter.get("/:id", HarvestController.getHarvestById);
harvestRouter.patch("/:id", HarvestController.updateHarvest);
harvestRouter.put("/:id", HarvestController.updateHarvest);
harvestRouter.delete("/:id", HarvestController.deleteHarvest);

