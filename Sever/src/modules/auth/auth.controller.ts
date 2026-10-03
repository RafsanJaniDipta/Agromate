import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { registerUser, loginUser } from "./auth.service.js";

export const handleRegister = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, password, locale } = req.body;

  if (!name || !phone) {
    sendError(res, 400, "Name and phone are required.");
    return;
  }

  const user = await registerUser({ name, phone, password, locale });

  sendSuccess(res, 201, "User registered successfully.", user);
});

export const handleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, remember } = req.body;

  if (!phone) {
    sendError(res, 400, "Phone number is required.");
    return;
  }

  const result = await loginUser({ phone, password, remember });

  sendSuccess(res, 200, result.message, result.user);
});

export const AuthController = {
  handleRegister,
  handleLogin,
};

