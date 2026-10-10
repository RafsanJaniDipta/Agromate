import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { cloudinary } from "../../config/cloudinary.js";
import {
  CONFIDENCE_LEVELS,
  saveDetection,
  getDetections as getDetectionsService,
  getDetectionById as getDetectionByIdService,
  deleteDetection as deleteDetectionService,
} from "./diseaseDetection.service.js";

// Photos of checked plants, one file per check
const DIAGNOSIS_PHOTO_FOLDER = "agromate/diagnoses";
// Limits for the AI's text, so a bad request can't store huge blobs
const MAX_TEXT = 1000;
const MAX_ADVICE_STEPS = 6;

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw AppError.unauthorized("User is not authenticated");
  }
  return userId;
}

const text = (value: unknown) => String(value ?? "").trim().slice(0, MAX_TEXT);

// The advice list arrives as a JSON string in the multipart form
function parseAdvice(value: unknown): string[] {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error();
    return parsed.slice(0, MAX_ADVICE_STEPS).map(text).filter(Boolean);
  } catch {
    throw AppError.unprocessable("advice must be a JSON array of strings");
  }
}

// Cloudinary's id for a stored photo, taken from its URL (".../agromate/diagnoses/<id>.jpg")
const photoIdFromUrl = (url: string) => url.match(/agromate\/diagnoses\/[^./]+/)?.[0] ?? null;

// POST /api/disease-detections (multipart): saves one AI check with its photo.
// Fields: image (file), cropName, isHealthy ("true"/"false"), disease, confidence, symptoms,
// advice (JSON array), and optional cropCycleId to link it to one of the farmer's crops.
export const createDetection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  if (!req.file) {
    throw AppError.badRequest("No image file provided. Send a multipart/form-data request with field 'image'.");
  }

  const confidence = CONFIDENCE_LEVELS.find((level) => level === req.body.confidence);
  if (!confidence) {
    throw AppError.unprocessable(`confidence must be one of: ${CONFIDENCE_LEVELS.join(", ")}`);
  }
  const input = {
    userId,
    cropCycleId: text(req.body.cropCycleId) || undefined,
    cropName: text(req.body.cropName),
    isHealthy: req.body.isHealthy === "true",
    disease: text(req.body.disease),
    confidence,
    symptoms: text(req.body.symptoms),
    advice: parseAdvice(req.body.advice),
  };

  const imageUrl = await new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: DIAGNOSIS_PHOTO_FOLDER, public_id: randomUUID(), resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(new Error(error?.message ?? "Cloudinary upload failed"));
        else resolve(result.secure_url);
      },
    );
    uploadStream.end(req.file!.buffer);
  });

  try {
    const detection = await saveDetection({ ...input, imageUrl });
    sendSuccess(res, 201, "Disease check saved successfully", detection);
  } catch (error) {
    // Don't leave an orphan photo behind when the record couldn't be saved
    const photoId = photoIdFromUrl(imageUrl);
    if (photoId) await cloudinary.uploader.destroy(photoId).catch(() => {});
    throw error;
  }
});

// GET /api/disease-detections?page=&limit=&cropCycleId=
export const getDetections = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const { page, limit, cropCycleId } = req.query;

  const result = await getDetectionsService(userId, {
    page: page ? Math.max(Number(page), 1) : 1,
    limit: limit ? Math.min(Math.max(Number(limit), 1), 50) : 10,
    cropCycleId: typeof cropCycleId === "string" ? cropCycleId : undefined,
  });
  sendSuccess(res, 200, "Disease checks fetched successfully", result);
});

export const getDetectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const detection = await getDetectionByIdService(String(req.params.id || ""), userId);
  if (!detection) {
    throw AppError.notFound("Disease check not found or unauthorized");
  }
  sendSuccess(res, 200, "Disease check fetched successfully", detection);
});

// DELETE /api/disease-detections/:id: removes a check and its photo
export const deleteDetection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const imageUrl = await deleteDetectionService(String(req.params.id || ""), userId);
  if (imageUrl === null) {
    throw AppError.notFound("Disease check not found or unauthorized");
  }

  // The record is gone; a failed clean-up only leaves an unused file behind
  const photoId = photoIdFromUrl(imageUrl);
  if (photoId) await cloudinary.uploader.destroy(photoId).catch(() => {});
  sendSuccess(res, 200, "Disease check deleted successfully", { id: req.params.id });
});

export const DiseaseDetectionController = {
  createDetection,
  getDetections,
  getDetectionById,
  deleteDetection,
};
