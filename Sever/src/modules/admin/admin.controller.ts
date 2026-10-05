import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendPaginatedSuccess, sendSuccess } from "../../utils/apiResponse.js";
import {
  getAllUsersFromDB,
  updateUserRoleStatusInDB,
  getPlatformStatistics,
  getDeliveryAgentsFromDB,
  getExpertApplications as getExpertApplicationsService,
  reviewExpertApplication as reviewExpertApplicationService,
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

  const adminId = req.user?.id;

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

export const getExpertApplications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;
  const result = await getExpertApplicationsService(typeof status === "string" ? status : undefined);
  sendSuccess(res, 200, "Expert applications retrieved successfully", result);
});

export const reviewExpertApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status, rejectionReason } = req.body;
  const result = await reviewExpertApplicationService(String(req.params.userId), status, rejectionReason);
  sendSuccess(res, 200, "Expert application reviewed successfully", result);
});

export const AdminController = {
  getExpertApplications,
  reviewExpertApplication,
  getAllUsers,
  updateUserStatus,
  getStatistics,
  getDeliveryAgents,
};
