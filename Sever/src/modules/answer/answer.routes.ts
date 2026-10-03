import { Router } from "express";
import { createAnswer, getAnswers, acceptAnswer, deleteAnswer } from "./answer.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const answerRouter = Router();

answerRouter.use(authenticate);

answerRouter.post("/", createAnswer);
answerRouter.get("/", getAnswers);
answerRouter.patch("/:id/accept", acceptAnswer);
answerRouter.delete("/:id", deleteAnswer);
