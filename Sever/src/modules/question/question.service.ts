import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { parseEnum } from "../../utils/enum.js";
import { QuestionStatus, type Prisma } from "../../generated/prisma/client.js";

const isAdmin = (role: string) => role.toUpperCase() === "ADMIN";

export interface CreateQuestionInput {
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cropId?: string;
}

export interface AddAnswerInput {
  questionId: string;
  userId: string;
  content: string;
}

export const createQuestion = serviceHandler(async (data: CreateQuestionInput) => {
  return await prisma.question.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      cropId: data.cropId,
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });
});

export const getQuestions = serviceHandler(async (params: {
  status?: string;
  search?: string;
  cropId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = {
    ...(params.status ? { status: parseEnum(QuestionStatus, params.status, "status") } : {}),
    ...(params.cropId ? { cropId: params.cropId } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
        crop: { select: { id: true, name: true, nameBn: true } },
        _count: { select: { answers: true } },
      },
    }),
  ]);

  return {
    items,
    meta: { page, limit, total },
  };
});

export const getQuestionById = serviceHandler(async (id: string) => {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
      answers: {
        include: {
          user: { select: { id: true, name: true, image: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { answers: true } },
    },
  });

  if (!question) return null;

  return {
    ...question,
    totalAnswers: question._count.answers,
  };
});

export const addAnswer = serviceHandler(async (data: AddAnswerInput) => {
  const question = await prisma.question.findUnique({ where: { id: data.questionId } });
  if (!question) return null;

  // The first answer moves an open question out of the experts' waiting list
  const [answer] = await prisma.$transaction([
    prisma.answer.create({
      data: {
        questionId: data.questionId,
        userId: data.userId,
        content: data.content,
      },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    }),
    prisma.question.updateMany({
      where: { id: data.questionId, status: "OPEN" },
      data: { status: "ANSWERED" },
    }),
  ]);

  return answer;
});

export const updateQuestionStatus = serviceHandler(async (id: string, userId: string, userRole: string, status: string) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return null;

  if (!isAdmin(userRole) && question.userId !== userId) {
    return false;
  }

  return await prisma.question.update({
    where: { id },
    data: { status: parseEnum(QuestionStatus, status, "status") },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });
});

export const deleteQuestion = serviceHandler(async (id: string, userId: string, userRole: string) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return false;

  if (!isAdmin(userRole) && question.userId !== userId) {
    return false;
  }

  await prisma.question.delete({ where: { id } });
  return true;
});

export const QuestionService = {
  createQuestion,
  getQuestions,
  getQuestionById,
  addAnswer,
  updateQuestionStatus,
  deleteQuestion,
};
