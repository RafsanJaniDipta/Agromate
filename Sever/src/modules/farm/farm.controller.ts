import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { cloudinary } from "../../config/cloudinary.js";
import { createFarm as createFarmService, getFarmsByUserId, getFarmById as getFarmByIdService, updateFarm as updateFarmService, deleteFarm as deleteFarmService, setFarmPhoto } from "./farm.service.js";
import { createField as createFieldService, getFieldsByFarmId as getFieldsByFarmIdService } from "../field/field.service.js";

// Farm photos live in one Cloudinary folder, one image per farm, so a new photo replaces the old
const FARM_PHOTO_FOLDER = "agromate/farms";
const farmPhotoId = (farmId: string) => `farm_${farmId}`;

export const createFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const { name, location, totalArea, areaInAcres, soilType } = req.body;
  if (!name || !location) {
    throw AppError.unprocessable("Name and location are required");
  }

  const farm = await createFarmService({
    name,
    location,
    totalArea: totalArea !== undefined ? Number(totalArea) : undefined,
    areaInAcres: areaInAcres !== undefined ? Number(areaInAcres) : undefined,
    soilType,
    userId,
  });

  sendSuccess(res, 201, "Farm created successfully", farm);
});

export const getFarms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const farms = await getFarmsByUserId(userId);
  sendSuccess(res, 200, "Farms fetched successfully", farms);
});

export const getFarmById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const farm = await getFarmByIdService(id, userId);
  if (!farm) {
    throw AppError.notFound("Farm not found");
  }

  sendSuccess(res, 200, "Farm details fetched successfully", farm);
});

export const updateFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const updated = await updateFarmService(id, userId, req.body);
  if (!updated) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 200, "Farm updated successfully", updated);
});

export const deleteFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const deleted = await deleteFarmService(id, userId);
  if (!deleted) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  // The farm's photo goes too; a failed clean-up only leaves an unused file behind
  await cloudinary.uploader.destroy(`${FARM_PHOTO_FOLDER}/${farmPhotoId(id)}`).catch(() => {});

  sendSuccess(res, 200, "Farm deleted successfully", { message: "Farm deleted successfully" });
});

export const createFieldForFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const farmId = String(req.params.farmId || "");
  const { name, area, areaInAcres, soilType, boundary } = req.body;
  if (!name) {
    throw AppError.unprocessable("Field name is required");
  }

  const field = await createFieldService({
    farmId,
    name,
    area: area !== undefined ? Number(area) : undefined,
    areaInAcres: areaInAcres !== undefined ? Number(areaInAcres) : undefined,
    soilType,
    boundary,
    userId,
  });

  if (!field) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 201, "Field created successfully", field);
});

export const getFieldsForFarm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const farmId = String(req.params.farmId || "");
  const fields = await getFieldsByFarmIdService(farmId, userId);
  if (fields === null) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  sendSuccess(res, 200, "Fields fetched successfully", fields);
});

// POST /api/farms/:id/photo (multipart, field "photo"): uploads a photo of the whole farm
export const uploadFarmPhoto = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }
  if (!req.file) {
    throw AppError.badRequest("No image file provided. Send a multipart/form-data request with field 'photo'.");
  }

  // Check ownership first, so nobody can upload into someone else's farm
  const id = String(req.params.id || "");
  if (!(await getFarmByIdService(id, userId))) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  const imageUrl = await new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FARM_PHOTO_FOLDER,
        public_id: farmPhotoId(id),
        overwrite: true,
        resource_type: "image",
        // Stored as sent: the browser already sized it, and re-encoding here would only blur it.
        // Sizing for each screen happens when the photo is shown (see FarmPhotoCard).
      },
      (error, result) => {
        if (error || !result) reject(new Error(error?.message ?? "Cloudinary upload failed"));
        else resolve(result.secure_url);
      },
    );
    uploadStream.end(req.file!.buffer);
  });

  const farm = await setFarmPhoto(id, userId, imageUrl);
  sendSuccess(res, 200, "Farm photo uploaded successfully", farm);
});

// DELETE /api/farms/:id/photo: removes the farm's photo
export const removeFarmPhoto = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }

  const id = String(req.params.id || "");
  const farm = await setFarmPhoto(id, userId, null);
  if (!farm) {
    throw AppError.notFound("Farm not found or unauthorized");
  }

  // The record no longer points at the image; a failed clean-up only leaves an unused file behind
  await cloudinary.uploader.destroy(`${FARM_PHOTO_FOLDER}/${farmPhotoId(id)}`).catch(() => {});
  sendSuccess(res, 200, "Farm photo removed successfully", farm);
});

export const FarmController = {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  createFieldForFarm,
  getFieldsForFarm,
  uploadFarmPhoto,
  removeFarmPhoto,
};
