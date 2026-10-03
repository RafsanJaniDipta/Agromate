import { Router } from "express";
import { AnswerController } from "./answer.controller.js";

export const answerRouter = Router();

answerRouter.post("/", AnswerController.createAnswer);
answerRouter.get("/", AnswerController.getAnswers);
answerRouter.patch("/:id/accept", AnswerController.acceptAnswer);
answerRouter.delete("/:id", AnswerController.deleteAnswer);
