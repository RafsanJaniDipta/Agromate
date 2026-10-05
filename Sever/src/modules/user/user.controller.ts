import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getUserById as getUserByIdService,
  updateUserProfile as updateUserProfileService,
  getAllUsers as getAllUsersService,
} from "./user.service.js";

export const getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const user = await getUserByIdService(userId);
  if (!user) {
    throw AppError.notFound("User profile not found");
  }

  sendSuccess(res, 200, "User profile fetched successfully", user);
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id || "");
  const user = await getUserByIdService(id);
  if (!user) {
    throw AppError.notFound("User not found");
  }

  sendSuccess(res, 200, "User details fetched successfully", user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { name, location, phone, image } = req.body;
  const updatedUser = await updateUserProfileService(userId, {
    name,
    location,
    phone,
    image,
  });

  sendSuccess(res, 200, "User profile updated successfully", updatedUser);
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { role } = req.query;
  const result = await getAllUsersService({ role: typeof role === "string" ? role : undefined });
  sendSuccess(res, 200, "Users fetched successfully", { data: result.data, meta: result.meta });
});

export const UserController = {
  getCurrentUser,
  getUserById,
  updateProfile,
  getAllUsers,
};
