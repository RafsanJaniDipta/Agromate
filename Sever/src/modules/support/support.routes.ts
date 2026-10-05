import { Router } from "express";
import { optionalAuthenticate } from "../../middlewares/auth.middleware.js";
import { handleCreateSupport } from "./support.controller.js";

export const supportRouter = Router();

// Open to visitors; a logged-in user's ticket is linked to their account
supportRouter.post("/", optionalAuthenticate, handleCreateSupport);
