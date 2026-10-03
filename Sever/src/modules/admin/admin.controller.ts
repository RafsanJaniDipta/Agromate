import type { Request, Response } from "express";
import { AdminService } from "./admin.service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.getAllUsersFromDB();
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const adminId = (req as any).user?.id as string;

    const result = await AdminService.updateUserRoleStatusInDB(
      id as string,
      { status, role },
      adminId
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const getStatistics = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.getPlatformStatistics();

    res.status(200).json({
      success: true,
      message: "Platform statistics retrieved successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

const getDeliveryAgents = async (req: Request, res: Response) => {
  try {
    const result = await AdminService.getDeliveryAgentsFromDB();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as any).message });
  }
};

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getStatistics,
  getDeliveryAgents,
};
