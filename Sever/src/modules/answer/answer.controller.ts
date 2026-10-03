import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  createAnswer as createAnswerService,
  getAnswersByQuestionId as getAnswersByQuestionIdService,
  acceptAnswer as acceptAnswerService,
  deleteAnswer as deleteAnswerService,
} from "./answer.service.js";

export const createAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id || req.body.userId;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { questionId, content } = req.body;
  if (!questionId || !content) {
    throw AppError.badRequest("questionId and content are required");
  }

  const answer = await createAnswerService({
    questionId,
    userId,
    content,
  });

  sendSuccess(res, 201, "Answer posted successfully", answer);
});

export const getAnswers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { questionId } = req.query;
  if (!questionId || typeof questionId !== "string") {
    throw AppError.badRequest("questionId query parameter is required");
  }

  const answers = await getAnswersByQuestionIdService(questionId);
  sendSuccess(res, 200, "Answers fetched successfully", answers);
});

export const acceptAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = (req as any).user?.id || req.body.userId;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const answer = await acceptAnswerService(id, userId);
  sendSuccess(res, 200, "Answer accepted successfully", answer);
});

export const deleteAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = (req as any).user?.id || (req.query.userId as string);
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const deleted = await deleteAnswerService(id, userId);
  if (deleted.count === 0) {
    throw AppError.notFound("Answer not found or unauthorized to delete");
  }

  sendSuccess(res, 200, "Answer deleted successfully", { id });
});

export const AnswerController = {
  createAnswer,
  getAnswers,
  acceptAnswer,
  deleteAnswer,
};
