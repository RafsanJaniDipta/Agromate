import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  markMessagesAsRead,
} from "./chat.service.js";

/**
 * Get or initialize conversation between current user and an expert/admin/farmer.
 */
export const initiateConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    throw AppError.unauthorized("Authentication required");
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    throw AppError.unprocessable("Target user ID is required");
  }

  const conversation = await getOrCreateConversation({
    initiatorId: currentUserId,
    targetUserId,
  });

  sendSuccess(res, 200, "Conversation retrieved successfully", conversation);
});

/**
 * Fetch all conversations for the authenticated user.
 */
export const getMyConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    throw AppError.unauthorized("Authentication required");
  }

  const conversations = await getUserConversations(currentUserId);
  sendSuccess(res, 200, "Conversations retrieved successfully", conversations);
});

/**
 * Get messages in a specific conversation.
 */
export const getMessages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    throw AppError.unauthorized("Authentication required");
  }

  const conversationId = String(req.params.conversationId || "");
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  const messages = await getConversationMessages(conversationId, limit, cursor);

  // Mark unread messages as read
  await markMessagesAsRead(conversationId, currentUserId);

  sendSuccess(res, 200, "Messages retrieved successfully", messages);
});

export const ChatController = {
  initiateConversation,
  getMyConversations,
  getMessages,
};
