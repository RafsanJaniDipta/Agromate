import type { Request, Response } from "express";
import { QuestionService } from "./question.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { title, content, image, imageUrl, category } = req.body;
    if (!title || !content) {
      sendError(res, 422, "Title and content are required");
      return;
    }

    const question = await QuestionService.createQuestion({
      userId,
      title,
      content,
      image,
      imageUrl,
      category,
    });

    sendSuccess(res, 201, "Question posted successfully", question);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to post question");
  }
};

const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, category, page, limit } = req.query;
    const result = await QuestionService.getQuestions({
      status: typeof status === "string" ? status : undefined,
      search: typeof search === "string" ? search : undefined,
      category: typeof category === "string" ? category : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: "Questions fetched successfully",
      data: result.items,
      meta: result.meta,
    });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch questions");
  }
};

const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const question = await QuestionService.getQuestionById(id);
    if (!question) {
      sendError(res, 404, "Question not found");
      return;
    }

    sendSuccess(res, 200, "Question details fetched successfully", question);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch question details");
  }
};

const addAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const questionId = String(req.params.id || "");
    const { content } = req.body;
    if (!content) {
      sendError(res, 422, "Content is required for answer");
      return;
    }

    const answer = await QuestionService.addAnswer({
      questionId,
      userId,
      content,
    });

    if (!answer) {
      sendError(res, 404, "Question not found");
      return;
    }

    sendSuccess(res, 201, "Answer added successfully", answer);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to add answer");
  }
};

const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || "";
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const { status } = req.body;
    if (!status) {
      sendError(res, 422, "Status is required");
      return;
    }

    const updated = await QuestionService.updateQuestionStatus(id, userId, userRole, status);
    if (updated === null) {
      sendError(res, 404, "Question not found");
      return;
    }
    if (updated === false) {
      sendError(res, 403, "Forbidden: Only the question owner or Admin can change status");
      return;
    }

    sendSuccess(res, 200, "Question status updated successfully", updated);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update question status");
  }
};

const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || "";
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await QuestionService.deleteQuestion(id, userId, userRole);
    if (!deleted) {
      sendError(res, 404, "Question not found or unauthorized to delete");
      return;
    }

    sendSuccess(res, 200, "Question deleted successfully", { message: "Question deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete question");
  }
};

export const QuestionController = {
  createQuestion,
  getQuestions,
  getQuestionById,
  addAnswer,
  updateStatus,
  deleteQuestion,
};


