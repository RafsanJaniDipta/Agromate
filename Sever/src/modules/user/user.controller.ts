import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      sendError(res, 404, "User profile not found");
      return;
    }

    sendSuccess(res, 200, "User profile fetched successfully", user);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch user profile");
  }
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id || "");
    const user = await UserService.getUserById(id);
    if (!user) {
      sendError(res, 404, "User not found");
      return;
    }

    sendSuccess(res, 200, "User details fetched successfully", user);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch user details");
  }
};

const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const { name, location, phone, image } = req.body;
    const updatedUser = await UserService.updateUserProfile(userId, {
      name,
      location,
      phone,
      image,
    });

    sendSuccess(res, 200, "User profile updated successfully", updatedUser);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update user profile");
  }
};

const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const users = await UserService.getAllUsers(typeof role === "string" ? role : undefined);
    sendSuccess(res, 200, "Users fetched successfully", users);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch users");
  }
};

export const UserController = {
  getCurrentUser,
  getUserById,
  updateProfile,
  getAllUsers,
};

