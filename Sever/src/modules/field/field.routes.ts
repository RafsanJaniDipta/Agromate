import { Router } from "express";
import { FieldController } from "./field.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

export const fieldRouter = Router();

fieldRouter.use(authenticate, farmerOnly);

fieldRouter.get("/:id", FieldController.getFieldById);
fieldRouter.patch("/:id", FieldController.updateField);
fieldRouter.put("/:id", FieldController.updateField);
fieldRouter.delete("/:id", FieldController.deleteField);

