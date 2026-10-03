import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateQuestionInput {
  userId: string;
  title: string;
  content: string;
  image?: string;
  imageUrl?: string;
  category?: string;
}

export interface AddAnswerInput {
  questionId: string;
  userId: string;
  content: string;
}

export const createQuestion = serviceHandler(async (data: CreateQuestionInput) => {
  const img = data.image ?? data.imageUrl;
  return await prisma.question.create({
    data: {
      userId: data.userId,
      title: data.title,
      content: data.content,
      imageUrl: img,
      category: data.category ?? "General",
      status: "PENDING" as any,
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });
});

export const getQuestions = serviceHandler(async (params: {
  status?: string;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = {
    ...(params.status ? { status: params.status as any } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { content: { contains: params.search, mode: "insensitive" } },
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

  const answer = await prisma.answer.create({
    data: {
      questionId: data.questionId,
      userId: data.userId,
      content: data.content,
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  return answer;
});

export const updateQuestionStatus = serviceHandler(async (id: string, userId: string, userRole: string, status: string) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return null;

  if (userRole !== "ADMIN" && question.userId !== userId) {
    return false;
  }

  return await prisma.question.update({
    where: { id },
    data: { status: status as any },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
    },
  });
});

export const deleteQuestion = serviceHandler(async (id: string, userId: string, userRole: string) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return false;

  if (userRole !== "ADMIN" && question.userId !== userId) {
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
