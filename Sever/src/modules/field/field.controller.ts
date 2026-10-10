import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import {
  getFieldById as getFieldByIdService,
  updateField as updateFieldService,
  deleteField as deleteFieldService,
} from "./field.service.js";

export const getFieldById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const field = await getFieldByIdService(id, userId);
  if (!field) {
    throw AppError.notFound("Field not found or unauthorized");
  }

  sendSuccess(res, 200, "Field details fetched successfully", field);
});

export const updateField = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const field = await updateFieldService(id, userId, req.body);
  if (!field) {
    throw AppError.notFound("Field not found or unauthorized");
  }

  sendSuccess(res, 200, "Field updated successfully", field);
});

export const deleteField = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteFieldService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Field not found or unauthorized");
  }

  sendSuccess(res, 200, "Field deleted successfully", { message: "Field deleted successfully" });
});

export const FieldController = {
  getFieldById,
  updateField,
  deleteField,
};
