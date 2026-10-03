import { Router } from "express";
import { QuestionController } from "./question.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { farmerOnly, expertOnly } from "../../middlewares/role.middleware.js";

export const questionRouter = Router();

questionRouter.get("/", QuestionController.getQuestions);
questionRouter.get("/:id", QuestionController.getQuestionById);

questionRouter.post("/", authenticate, farmerOnly, QuestionController.createQuestion);
questionRouter.post("/:id/answers", authenticate, expertOnly, QuestionController.addAnswer);
questionRouter.patch("/:id/status", authenticate, QuestionController.updateStatus);
questionRouter.delete("/:id", authenticate, QuestionController.deleteQuestion);

