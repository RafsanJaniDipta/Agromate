import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateAnswerInput {
  questionId: string;
  userId: string;
  content: string;
  isExpertAnswer?: boolean;
}

export interface UpdateAnswerInput {
  content?: string;
  isAccepted?: boolean;
}

export const createAnswer = serviceHandler(async (data: CreateAnswerInput) => {
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  const isExpertAnswer = data.isExpertAnswer ?? user?.role === "EXPERT";

  return await prisma.answer.create({
    data: {
      ...data,
      isExpertAnswer,
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });
});

export const getAnswersByQuestionId = serviceHandler(async (questionId: string) => {
  return await prisma.answer.findMany({
    where: { questionId },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
    orderBy: [{ isAccepted: "desc" }, { isExpertAnswer: "desc" }, { createdAt: "asc" }],
  });
});

export const updateAnswer = serviceHandler(async (id: string, userId: string, data: UpdateAnswerInput) => {
  return await prisma.answer.updateMany({
    where: { id, userId },
    data,
  });
});

export const acceptAnswer = serviceHandler(async (answerId: string, questionOwnerUserId: string) => {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });

  if (!answer || answer.question.userId !== questionOwnerUserId) {
    throw new Error("Unauthorized to accept answer for this question");
  }

  await prisma.answer.updateMany({
    where: { questionId: answer.questionId },
    data: { isAccepted: false },
  });

  await prisma.question.update({
    where: { id: answer.questionId },
    data: { status: "ANSWERED" },
  });

  return await prisma.answer.update({
    where: { id: answerId },
    data: { isAccepted: true },
  });
});

export const deleteAnswer = serviceHandler(async (id: string, userId: string) => {
  return await prisma.answer.deleteMany({
    where: { id, userId },
  });
});

export const AnswerService = {
  createAnswer,
  getAnswersByQuestionId,
  updateAnswer,
  acceptAnswer,
  deleteAnswer,
};
