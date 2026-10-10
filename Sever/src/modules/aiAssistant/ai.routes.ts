import { Router } from "express";
import {
  ask,
  deleteConversation,
  getConversation,
  getConversations,
  startConversation,
} from "./assistant.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly } from "../../middlewares/role.middleware.js";

// The farmer's AI assistant (mounted at /api/ai)
export const aiRouter = Router();

aiRouter.use(authenticate, farmerOnly);

aiRouter.get("/conversations", getConversations);
aiRouter.post("/conversations", startConversation);
aiRouter.get("/conversations/:id", getConversation);
aiRouter.post("/conversations/:id/messages", ask);
aiRouter.delete("/conversations/:id", deleteConversation);
