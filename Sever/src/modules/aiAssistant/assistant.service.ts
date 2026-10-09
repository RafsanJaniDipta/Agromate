import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";
import { askForText, type ChatTurn } from "../../services/ai.service.js";
import { buildFarmerContext } from "./farmerContext.js";

// The farmer's AI assistant: conversations saved per farmer, answered with the farmer's own
// fields, crops, weather and prices in mind.

const MESSAGE_MAX_LENGTH = 2000;
// How much of the conversation the model sees (older turns are left out)
const HISTORY_TURNS = 20;
// AI calls cost money; this many questions per farmer per hour is plenty
const QUESTIONS_PER_HOUR = 30;
const TITLE_LENGTH = 60;

const INSTRUCTIONS = `You are "Agromate Krishi Sohayok", a friendly farming assistant for farmers in Bangladesh, inside the Agromate app.

Rules:
- Reply in the language of the farmer's latest message: Bangla script if they write Bangla or Bangla in English letters, English if they write English.
- Be short and practical: at most about 8 short lines. Use simple everyday words. Use "• " for lists. No markdown headings, tables, bold or code.
- Use the farmer's data below (fields, crops, weather, prices) whenever it helps, and say which crop or field you mean.
- Fertilizer and pesticide doses must follow Bangladesh government recommendations (BARC, BARI, BRRI, DAE). For pesticides, remind them to follow the label and wear protection.
- Never invent prices, weather or facts. If the data below doesn't have it and you aren't sure, say so.
- For a serious disease or pest problem, suggest the app's disease check (photo) or messaging a verified expert from the app's Experts page.
- Only answer farming, livestock, fisheries, weather, market and farm-money questions; politely decline anything else.`;

const instructionsFor = (context: string) =>
  `${INSTRUCTIONS}\n\nToday (Bangladesh): ${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" })}\nThe farmer's data:\n${context}`;

function readQuestion(text: unknown) {
  const question = typeof text === "string" ? text.trim() : "";
  if (!question || question.length > MESSAGE_MAX_LENGTH) {
    throw AppError.unprocessable(`A question must be 1 to ${MESSAGE_MAX_LENGTH} characters`);
  }
  return question;
}

async function ensureWithinLimit(userId: string) {
  const asked = await prisma.aIMessage.count({
    where: {
      sender: "USER",
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      conversation: { userId },
    },
  });
  if (asked >= QUESTIONS_PER_HOUR) {
    throw new AppError(429, "You've asked a lot this hour. Please try again a little later.");
  }
}

const messageFields = { id: true, sender: true, content: true, createdAt: true } as const;

// Saves the question, asks the model with the conversation so far, saves and returns both
async function answer(userId: string, conversationId: string, question: string) {
  const [history, context] = await Promise.all([
    prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_TURNS,
      select: { sender: true, content: true },
    }),
    buildFarmerContext(userId),
  ]);

  const turns: ChatTurn[] = [
    ...history.reverse().map((message) => ({
      role: message.sender === "USER" ? ("user" as const) : ("assistant" as const),
      content: message.content,
    })),
    { role: "user", content: question },
  ];

  // Asked first, so a failed AI call leaves no unanswered question behind
  const reply = await askForText(instructionsFor(context), turns);

  const [asked, answered] = await prisma.$transaction([
    prisma.aIMessage.create({ data: { conversationId, sender: "USER", content: question }, select: messageFields }),
    prisma.aIMessage.create({ data: { conversationId, sender: "ASSISTANT", content: reply }, select: messageFields }),
    prisma.aIConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);
  return { question: asked, answer: answered };
}

async function ownConversation(userId: string, conversationId: string) {
  const conversation = await prisma.aIConversation.findFirst({ where: { id: conversationId, userId } });
  if (!conversation) throw AppError.notFound("Conversation not found");
  return conversation;
}

// The farmer's conversations, most recent first
export const getConversations = serviceHandler(async (userId: string) => {
  return prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
});

export const getConversation = serviceHandler(async (userId: string, conversationId: string) => {
  await ownConversation(userId, conversationId);
  const messages = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: messageFields,
  });
  return { id: conversationId, messages };
});

// Starts a conversation with its first question
export const startConversation = serviceHandler(async (userId: string, text: unknown) => {
  const question = readQuestion(text);
  await ensureWithinLimit(userId);

  const title = question.length > TITLE_LENGTH ? `${question.slice(0, TITLE_LENGTH)}…` : question;
  const conversation = await prisma.aIConversation.create({ data: { userId, title }, select: { id: true, title: true } });
  try {
    return { conversation, ...(await answer(userId, conversation.id, question)) };
  } catch (error) {
    // No empty conversation is left when the AI couldn't answer
    await prisma.aIConversation.delete({ where: { id: conversation.id } }).catch(() => {});
    throw error;
  }
});

export const askInConversation = serviceHandler(async (userId: string, conversationId: string, text: unknown) => {
  const question = readQuestion(text);
  await ownConversation(userId, conversationId);
  await ensureWithinLimit(userId);
  return answer(userId, conversationId, question);
});

export const deleteConversation = serviceHandler(async (userId: string, conversationId: string) => {
  await ownConversation(userId, conversationId);
  await prisma.aIConversation.delete({ where: { id: conversationId } });
  return { id: conversationId };
});
