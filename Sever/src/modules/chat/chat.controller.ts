import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getContacts as getContactsService,
  getConversations as getConversationsService,
  startConversation as startConversationService,
  getMessages as getMessagesService,
  sendMessage as sendMessageService,
  markConversationRead as markConversationReadService,
  getUnreadCount as getUnreadCountService,
} from "./chat.service.js";

// Routes use `authenticate`, so the user is always set
const currentUser = (req: Request) => ({ id: req.user!.id, role: req.user!.role ?? "FARMER" });
const conversationIdOf = (req: Request) => String(req.params.id ?? "");

export const getContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id, role } = currentUser(req);
  sendSuccess(res, 200, "Contacts fetched successfully", await getContactsService(id, role));
});

export const getConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Conversations fetched successfully", await getConversationsService(currentUser(req).id));
});

export const startConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId: targetUserId } = req.body ?? {};
  if (typeof targetUserId !== "string" || !targetUserId) {
    throw AppError.unprocessable("userId is required");
  }

  const { id, role } = currentUser(req);
  sendSuccess(res, 200, "Conversation ready", await startConversationService(id, role, targetUserId));
});

export const getMessages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const before = typeof req.query.before === "string" && req.query.before ? req.query.before : undefined;
  const page = await getMessagesService(conversationIdOf(req), currentUser(req).id, before);
  sendSuccess(res, 200, "Messages fetched successfully", page);
});

// JSON { content } for text, or multipart with a "photo" file and an optional "content" caption
export const sendMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const message = await sendMessageService(
    conversationIdOf(req),
    currentUser(req).id,
    req.body?.content,
    req.file?.buffer,
  );
  sendSuccess(res, 201, "Message sent", message);
});

export const markConversationRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await markConversationReadService(conversationIdOf(req), currentUser(req).id);
  sendSuccess(res, 200, "Conversation marked as read", result);
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Unread count fetched successfully", await getUnreadCountService(currentUser(req).id));
});
