import { Router } from "express";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  addAnswer,
  updateStatus,
  deleteQuestion,
} from "./question.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly, expertOnly } from "../../middlewares/role.middleware.js";

export const questionRouter = Router();

questionRouter.get("/", getQuestions);
questionRouter.get("/:id", getQuestionById);

questionRouter.post("/", authenticate, farmerOnly, createQuestion);
questionRouter.post("/:id/answers", authenticate, expertOnly, addAnswer);
questionRouter.patch("/:id/status", authenticate, updateStatus);
questionRouter.delete("/:id", authenticate, deleteQuestion);
