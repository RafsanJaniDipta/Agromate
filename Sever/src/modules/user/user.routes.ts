import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  getAllUsers,
  getUserById,
} from "./user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";

export const userRouter = Router();

userRouter.get("/me", authenticate, getCurrentUser);
userRouter.patch("/me", authenticate, updateProfile);
userRouter.put("/me", authenticate, updateProfile);
userRouter.get("/", authenticate, adminOnly, getAllUsers);
userRouter.get("/:id", authenticate, adminOnly, getUserById);

