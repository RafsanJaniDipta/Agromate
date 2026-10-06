import { Router } from "express";
import { initiateConversation, getMyConversations, getMessages } from "./chat.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const chatRouter = Router();

chatRouter.use(authenticate);

chatRouter.post("/conversations", initiateConversation);
chatRouter.get("/conversations", getMyConversations);
chatRouter.get("/conversations/:conversationId/messages", getMessages);
