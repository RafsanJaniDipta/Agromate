import { Router } from "express";
import {
  getFieldById,
  updateField,
  deleteField,
} from "./field.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const fieldRouter = Router();

fieldRouter.use(authenticate, farmerOnly);

fieldRouter.get("/:id", getFieldById);
fieldRouter.patch("/:id", updateField);
fieldRouter.put("/:id", updateField);
fieldRouter.delete("/:id", deleteField);

