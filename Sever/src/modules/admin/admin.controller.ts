import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendPaginatedSuccess, sendSuccess } from "../../utils/apiResponse.js";
import {
  getAllUsersFromDB,
  updateUserRoleStatusInDB,
  getPlatformStatistics,
  getDeliveryAgentsFromDB,
} from "./admin.service.js";

export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await getAllUsersFromDB({ page, limit });
  sendPaginatedSuccess(
    res,
    200,
    "Users retrieved successfully",
    result.data,
    result.meta
  );
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, role } = req.body;

  const adminId = (req as any).user?.id as string;

  const result = await updateUserRoleStatusInDB(
    id as string,
    { status, role },
    adminId
  );

  sendSuccess(res, 200, "User updated successfully", result);
});

export const getStatistics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const result = await getPlatformStatistics();

  sendSuccess(
    res,
    200,
    "Platform statistics retrieved successfully",
    result
  );
});

export const getDeliveryAgents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await getDeliveryAgentsFromDB({ page, limit });
  sendPaginatedSuccess(
    res,
    200,
    "Delivery agents retrieved successfully",
    result.data,
    result.meta
  );
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getStatistics,
  getDeliveryAgents,
};
