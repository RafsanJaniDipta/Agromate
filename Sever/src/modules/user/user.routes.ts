import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

export const userRouter = Router();

userRouter.get("/me", authenticate, UserController.getCurrentUser);
userRouter.patch("/me", authenticate, UserController.updateProfile);
userRouter.put("/me", authenticate, UserController.updateProfile);
userRouter.get("/", authenticate, UserController.getAllUsers);
userRouter.get("/:id", authenticate, UserController.getUserById);

