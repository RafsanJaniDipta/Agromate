import type { Request, Response } from "express";
import { AnswerService } from "./answer.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { questionId, content } = req.body;
    if (!questionId || !content) {
      sendError(res, 400, "questionId and content are required");
      return;
    }

    const answer = await AnswerService.createAnswer({
      questionId,
      userId,
      content,
    });

    sendSuccess(res, 201, "Answer posted successfully", answer);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to post answer");
  }
};

const getAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId } = req.query;
    if (!questionId || typeof questionId !== "string") {
      sendError(res, 400, "questionId query parameter is required");
      return;
    }

    const answers = await AnswerService.getAnswersByQuestionId(questionId);
    sendSuccess(res, 200, "Answers fetched successfully", answers);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch answers");
  }
};

const acceptAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const answer = await AnswerService.acceptAnswer(id, userId);
    sendSuccess(res, 200, "Answer accepted successfully", answer);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to accept answer");
  }
};

const deleteAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const deleted = await AnswerService.deleteAnswer(id, userId);
    if (deleted.count === 0) {
      sendError(res, 404, "Answer not found or unauthorized to delete");
      return;
    }

    sendSuccess(res, 200, "Answer deleted successfully", { id });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete answer");
  }
};

export const AnswerController = {
  createAnswer,
  getAnswers,
  acceptAnswer,
  deleteAnswer,
};

