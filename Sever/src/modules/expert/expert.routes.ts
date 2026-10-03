import { Router } from "express";
import {
  getVerifiedExperts,
  getOwnProfile,
  updateOwnProfile,
  getVerifiedExpertById,
} from "./expert.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { expertOnly } from "../../middlewares/role.middleware.js";

export const expertRouter = Router();

expertRouter.get("/", getVerifiedExperts);
expertRouter.get("/me", authenticate, expertOnly, getOwnProfile);
expertRouter.put("/me", authenticate, expertOnly, updateOwnProfile);
expertRouter.get("/:id", getVerifiedExpertById);

