import { Router } from "express";
import {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  createFieldForFarm,
  getFieldsForFarm,
  uploadFarmPhoto,
  removeFarmPhoto,
} from "./farm.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

export const farmRouter = Router();

farmRouter.use(authenticate, farmerOnly);

farmRouter.post("/", createFarm);
farmRouter.get("/", getFarms);
farmRouter.get("/:id", getFarmById);
farmRouter.patch("/:id", updateFarm);
farmRouter.put("/:id", updateFarm);
farmRouter.delete("/:id", deleteFarm);

farmRouter.post("/:farmId/fields", createFieldForFarm);

farmRouter.post("/:id/photo", upload.single("photo"), uploadFarmPhoto);
farmRouter.delete("/:id/photo", removeFarmPhoto);
farmRouter.get("/:farmId/fields", getFieldsForFarm);
