import { Router } from "express";
import { ExpertController } from "./expert.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { expertOnly } from "../../middlewares/role.middleware.js";

export const expertRouter = Router();

expertRouter.get("/", ExpertController.getVerifiedExperts);
expertRouter.get("/me", authenticate, expertOnly, ExpertController.getOwnProfile);
expertRouter.put("/me", authenticate, expertOnly, ExpertController.updateOwnProfile);
expertRouter.get("/:id", ExpertController.getVerifiedExpertById);

