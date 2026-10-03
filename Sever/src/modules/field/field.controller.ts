import type { Request, Response } from "express";
import { FieldService } from "./field.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const getFieldById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const field = await FieldService.getFieldById(id, userId);
    if (!field) {
      sendError(res, 404, "Field not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Field details fetched successfully", field);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to fetch field details");
  }
};

const updateField = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const field = await FieldService.updateField(id, userId, req.body);
    if (!field) {
      sendError(res, 404, "Field not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Field updated successfully", field);
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to update field");
  }
};

const deleteField = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendError(res, 401, "User is not authenticated");
      return;
    }

    const id = String(req.params.id || "");
    const deleted = await FieldService.deleteField(id, userId);
    if (!deleted) {
      sendError(res, 404, "Field not found or unauthorized");
      return;
    }

    sendSuccess(res, 200, "Field deleted successfully", { message: "Field deleted successfully" });
  } catch (error: any) {
    sendError(res, 500, error.message || "Failed to delete field");
  }
};

export const FieldController = {
  getFieldById,
  updateField,
  deleteField,
};


