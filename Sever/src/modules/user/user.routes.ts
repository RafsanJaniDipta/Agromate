import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  getAllUsers,
  getUserById,
  uploadProfilePicture,
} from "./user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

import { validate } from "../../middlewares/validation.middleware.js";
import { updateProfileSchema } from "./user.validation.js";

export const userRouter = Router();

userRouter.get("/me", authenticate, getCurrentUser);
userRouter.patch("/me", authenticate, validate({ body: updateProfileSchema }), updateProfile);
userRouter.put("/me", authenticate, validate({ body: updateProfileSchema }), updateProfile);

/**
 * POST /api/v1/users/me/avatar
 * Body: multipart/form-data  |  field: avatar  |  max size: 5 MB
 * Written by: Masud (profile-picture upload feature)
 */
userRouter.post("/me/avatar", authenticate, upload.single("avatar"), uploadProfilePicture);

userRouter.get("/", authenticate, adminOnly, getAllUsers);
userRouter.get("/:id", authenticate, adminOnly, getUserById);

