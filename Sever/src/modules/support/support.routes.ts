import { Router } from "express";
import { handleCreateSupport } from "./support.controller.js";

export const supportRouter = Router();

supportRouter.post("/", handleCreateSupport);
