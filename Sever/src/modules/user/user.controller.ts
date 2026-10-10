import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { cloudinary } from "../../config/cloudinary.js";
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
  const updatedUser = await updateUserProfileService(userId, req.body);

  sendSuccess(res, 200, "User profile updated successfully", updatedUser);
});

/**
 * POST /api/v1/users/me/avatar
 *
 * Accepts a multipart/form-data upload with a single field named "avatar".
 * The file is streamed to Cloudinary (agromate/avatars folder) and the
 * resulting secure URL is saved back to the user's profile.
 *
 * Written by: Masud (profile-picture upload feature)
 */
export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  if (!req.file) {
    throw AppError.badRequest("No image file provided. Send a multipart/form-data request with field 'avatar'.");
  }

  // Stream the buffer to Cloudinary
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "agromate/avatars",
        public_id: `user_${userId}`,
        overwrite: true,
        resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? "Cloudinary upload failed"));
        } else {
          resolve(result.secure_url);
        }
      },
    );

    uploadStream.end(req.file!.buffer);
  });

  // Persist the Cloudinary URL to the user's profile
  const updatedUser = await updateUserProfileService(userId, { image: imageUrl });

  sendSuccess(res, 200, "Profile picture uploaded successfully", updatedUser);
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
  uploadProfilePicture,
  getAllUsers,
};
