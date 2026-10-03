import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendPaginatedSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createQuestion as createQuestionService,
  getQuestions as getQuestionsService,
  getQuestionById as getQuestionByIdService,
  addAnswer as addAnswerService,
  updateQuestionStatus as updateQuestionStatusService,
  deleteQuestion as deleteQuestionService,
} from "./question.service.js";

export const createQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { title, content, image, imageUrl, category } = req.body;
  if (!title || !content) {
    throw AppError.unprocessable("Title and content are required");
  }

  const question = await createQuestionService({
    userId,
    title,
    content,
    image,
    imageUrl,
    category,
  });

  sendSuccess(res, 201, "Question posted successfully", question);
});

export const getQuestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, search, category, page, limit } = req.query;
  const result = await getQuestionsService({
    status: typeof status === "string" ? status : undefined,
    search: typeof search === "string" ? search : undefined,
    category: typeof category === "string" ? category : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendPaginatedSuccess(res, 200, "Questions fetched successfully", result.items, result.meta);
});

export const getQuestionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const question = await getQuestionByIdService(id);
  if (!question) {
    throw AppError.notFound("Question not found");
  }

  sendSuccess(res, 200, "Question details fetched successfully", question);
});

export const addAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const questionId = String(req.params.id || "");
  const { content } = req.body;
  if (!content) {
    throw AppError.unprocessable("Content is required for answer");
  }

  const answer = await addAnswerService({
    questionId,
    userId,
    content,
  });

  if (!answer) {
    throw AppError.notFound("Question not found");
  }

  sendSuccess(res, 201, "Answer added successfully", answer);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "";
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const { status } = req.body;
  if (!status) {
    throw AppError.unprocessable("Status is required");
  }

  const updated = await updateQuestionStatusService(id, userId, userRole, status);
  if (updated === null) {
    throw AppError.notFound("Question not found");
  }
  if (updated === false) {
    throw AppError.forbidden("Forbidden: Only the question owner or Admin can change status");
  }

  sendSuccess(res, 200, "Question status updated successfully", updated);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const userRole = req.user?.role || "";
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteQuestionService(id, userId, userRole);
  if (!deleted) {
    throw AppError.notFound("Question not found or unauthorized to delete");
  }

  sendSuccess(res, 200, "Question deleted successfully", { message: "Question deleted successfully" });
});

export const QuestionController = {
  createQuestion,
  getQuestions,
  getQuestionById,
  addAnswer,
  updateStatus,
  deleteQuestion,
};
