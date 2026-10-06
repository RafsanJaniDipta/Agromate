import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";

export interface CreateConversationInput {
  initiatorId: string;
  targetUserId: string;
}

export interface SaveMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
}

const userSelectFields = {
  id: true,
  name: true,
  image: true,
  role: true,
};

/**
 * Get an existing conversation between two users or create a new one.
 * Validates role restrictions:
 * - Admin <-> Expert allowed
 * - Farmer <-> Expert allowed
 * - Farmer <-> Farmer or Farmer <-> Admin restricted
 */
export const getOrCreateConversation = serviceHandler(async (data: CreateConversationInput) => {
  if (data.initiatorId === data.targetUserId) {
    throw AppError.badRequest("Cannot start a conversation with yourself");
  }

  const [initiator, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: data.initiatorId }, select: { id: true, role: true } }),
    prisma.user.findUnique({ where: { id: data.targetUserId }, select: { id: true, role: true } }),
  ]);

  if (!initiator || !target) {
    throw AppError.notFound("One or both users not found");
  }

  const roles = [initiator.role, target.role];
  const isExpertInvolved = roles.includes("EXPERT");
  const isFarmerInvolved = roles.includes("FARMER");
  const isAdminInvolved = roles.includes("ADMIN");

  // Enforce conversation rules:
  // 1. Farmer can ONLY talk to Expert.
  // 2. Admin can ONLY talk to Expert.
  // 3. Expert can talk to both Farmer and Admin.
  if (!isExpertInvolved) {
    throw AppError.forbidden("Conversations are only permitted between Farmers & Experts or Admins & Experts");
  }

  if (isFarmerInvolved && isAdminInvolved) {
    throw AppError.forbidden("Direct conversation between Farmers and Admins is not allowed");
  }

  // Consistent ordering of IDs to respect unique constraint
  const [p1, p2] = [data.initiatorId, data.targetUserId].sort();

  const existing = await prisma.chatConversation.findUnique({
    where: {
      participantOneId_participantTwoId: {
        participantOneId: p1,
        participantTwoId: p2,
      },
    },
    include: {
      participantOne: { select: userSelectFields },
      participantTwo: { select: userSelectFields },
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.chatConversation.create({
    data: {
      participantOneId: p1,
      participantTwoId: p2,
    },
    include: {
      participantOne: { select: userSelectFields },
      participantTwo: { select: userSelectFields },
    },
  });
});

/**
 * List all conversations for a specific user (Farmer, Expert, or Admin).
 */
export const getUserConversations = serviceHandler(async (userId: string) => {
  return await prisma.chatConversation.findMany({
    where: {
      OR: [{ participantOneId: userId }, { participantTwoId: userId }],
    },
    include: {
      participantOne: { select: userSelectFields },
      participantTwo: { select: userSelectFields },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });
});

/**
 * Fetch paginated message history for a conversation.
 */
export const getConversationMessages = serviceHandler(
  async (conversationId: string, limit = 50, cursor?: string) => {
    return await prisma.chatMessage.findMany({
      where: { conversationId },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: userSelectFields },
      },
    });
  }
);

/**
 * Save a message to database and update lastMessageAt.
 */
export const saveMessage = serviceHandler(async (data: SaveMessageInput) => {
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
      },
      include: {
        sender: { select: userSelectFields },
      },
    }),
    prisma.chatConversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return message;
});

/**
 * Mark all unread messages in a conversation as read by recipient.
 */
export const markMessagesAsRead = serviceHandler(
  async (conversationId: string, recipientId: string) => {
    return await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: recipientId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }
);

export const ChatService = {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  saveMessage,
  markMessagesAsRead,
};
