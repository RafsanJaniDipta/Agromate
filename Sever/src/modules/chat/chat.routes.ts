import { Router } from "express";
import {
  getContacts,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
} from "./chat.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const chatRouter = Router();

// Every role chats; who may talk to whom is checked in the service
chatRouter.use(authenticate);

chatRouter.get("/contacts", getContacts);
chatRouter.get("/unread-count", getUnreadCount);
chatRouter.get("/conversations", getConversations);
chatRouter.post("/conversations", startConversation);
chatRouter.get("/conversations/:id/messages", getMessages);
chatRouter.post("/conversations/:id/messages", sendMessage);
chatRouter.patch("/conversations/:id/read", markConversationRead);
