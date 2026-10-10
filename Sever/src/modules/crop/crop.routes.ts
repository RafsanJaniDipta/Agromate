import { Router } from "express";
import { createCrop, getCrops, getCropById, updateCrop, deleteCrop } from "./crop.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";

export const cropRouter = Router();

cropRouter.get("/", getCrops);
cropRouter.get("/:id", getCropById);

cropRouter.post("/", authenticate, adminOnly, createCrop);
cropRouter.patch("/:id", authenticate, adminOnly, updateCrop);
cropRouter.put("/:id", authenticate, adminOnly, updateCrop);
cropRouter.delete("/:id", authenticate, adminOnly, deleteCrop);
