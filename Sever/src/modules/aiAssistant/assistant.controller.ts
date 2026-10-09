import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  askInConversation,
  deleteConversation as deleteConversationService,
  getConversation as getConversationService,
  getConversations as getConversationsService,
  startConversation as startConversationService,
} from "./assistant.service.js";

// Routes use `authenticate`, so the user is always set
const userIdOf = (req: Request) => req.user!.id;
const conversationIdOf = (req: Request) => String(req.params.id ?? "");

export const getConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Conversations fetched successfully", await getConversationsService(userIdOf(req)));
});

export const getConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Conversation fetched successfully", await getConversationService(userIdOf(req), conversationIdOf(req)));
});

export const startConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, "Answered", await startConversationService(userIdOf(req), req.body?.message));
});

export const ask = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await askInConversation(userIdOf(req), conversationIdOf(req), req.body?.message);
  sendSuccess(res, 201, "Answered", result);
});

export const deleteConversation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 200, "Conversation deleted", await deleteConversationService(userIdOf(req), conversationIdOf(req)));
});
