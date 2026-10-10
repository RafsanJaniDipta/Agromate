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
import { upload } from "../../middlewares/upload.middleware.js";
import { CHAT_PHOTOS_MAX } from "./chat.service.js";

export const chatRouter = Router();

// Every role chats; who may talk to whom is checked in the service
chatRouter.use(authenticate);

chatRouter.get("/contacts", getContacts);
chatRouter.get("/unread-count", getUnreadCount);
chatRouter.get("/conversations", getConversations);
chatRouter.post("/conversations", startConversation);
chatRouter.get("/conversations/:id/messages", getMessages);
// Photos come as multipart; plain JSON text passes through upload untouched
chatRouter.post("/conversations/:id/messages", upload.array("photos", CHAT_PHOTOS_MAX), sendMessage);
chatRouter.patch("/conversations/:id/read", markConversationRead);
