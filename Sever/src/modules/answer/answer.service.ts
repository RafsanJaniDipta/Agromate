import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { createAndDispatchNotification } from "../notification/notification.service.js";

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
  const [user, question] = await Promise.all([
    prisma.user.findUnique({ where: { id: data.userId } }),
    prisma.question.findUnique({ where: { id: data.questionId } }),
  ]);

  const isExpertAnswer = data.isExpertAnswer ?? user?.role === "EXPERT";

  const answer = await prisma.answer.create({
    data: {
      ...data,
      isExpertAnswer,
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  // Notify question owner if answered by someone else
  if (question && question.userId !== data.userId) {
    void createAndDispatchNotification({
      userId: question.userId,
      title: isExpertAnswer ? "বিশেষজ্ঞের উত্তর" : "নতুন উত্তর",
      message: `${user?.name ?? "একজন ইউজার"} আপনার প্রশ্নের উত্তর দিয়েছেন: "${question.title.substring(0, 30)}..."`,
      type: "SUCCESS",
      referenceId: question.id,
    });
  }

  return answer;
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
