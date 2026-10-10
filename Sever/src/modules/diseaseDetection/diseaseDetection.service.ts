import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";
import { AppError } from "../../utils/AppError.js";

// The AI's certainty, as the client shows it
export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// Rough number for the old confidenceScore column, so older readers of it keep working
const confidenceScores: Record<ConfidenceLevel, number> = { high: 0.9, medium: 0.6, low: 0.3 };

// One finished AI check (the client got it from Gemini) to keep in the farmer's history
export interface SaveDetectionInput {
  userId: string;
  imageUrl: string;
  // Optional: which of the farmer's planted crops the photo is from
  cropCycleId?: string;
  cropName: string;
  isHealthy: boolean;
  disease: string;
  confidence: ConfidenceLevel;
  symptoms: string;
  advice: string[];
}

// Names that come with each record, so the history can say which field and crop it was
const detectionDetails = { cropCycle: { include: { crop: true, field: true } } } as const;

const findDetection = (id: string) => prisma.diseaseDetection.findUnique({ where: { id }, include: detectionDetails });
type DetectionRow = Awaited<ReturnType<typeof findDetection>>;

// The stored row in the shape the client uses
function toDetection(row: NonNullable<DetectionRow>) {
  let advice: string[] = [];
  try {
    const parsed: unknown = row.recommendations ? JSON.parse(row.recommendations) : [];
    advice = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    // Rows saved before advice was a JSON list hold plain text
    advice = row.recommendations ? [row.recommendations] : [];
  }

  return {
    id: row.id,
    imageUrl: row.imageUrl,
    cropName: row.cropName ?? "",
    isHealthy: row.isHealthy,
    disease: row.isHealthy ? "" : row.detectedDisease,
    confidence: CONFIDENCE_LEVELS.find((level) => level === row.confidenceLevel) ?? "low",
    symptoms: row.symptoms ?? "",
    advice,
    cropCycle: row.cropCycle
      ? {
          id: row.cropCycle.id,
          crop: { name: row.cropCycle.crop.name, nameBn: row.cropCycle.crop.nameBn },
          field: { name: row.cropCycle.field.name },
        }
      : null,
    createdAt: row.createdAt,
  };
}

export const saveDetection = serviceHandler(async (data: SaveDetectionInput) => {
  if (data.cropCycleId) {
    const ownCycle = await prisma.cropCycle.findFirst({
      where: { id: data.cropCycleId, field: { farm: { userId: data.userId } } },
      select: { id: true },
    });
    if (!ownCycle) {
      throw AppError.notFound("Crop cycle not found or unauthorized");
    }
  }

  const row = await prisma.diseaseDetection.create({
    data: {
      userId: data.userId,
      cropCycleId: data.cropCycleId,
      imageUrl: data.imageUrl,
      cropName: data.cropName,
      isHealthy: data.isHealthy,
      detectedDisease: data.isHealthy ? "Healthy" : data.disease || "Unknown",
      confidenceLevel: data.confidence,
      confidenceScore: confidenceScores[data.confidence],
      symptoms: data.symptoms,
      recommendations: JSON.stringify(data.advice),
    },
    include: detectionDetails,
  });
  return toDetection(row);
});

// The farmer's checks, newest first; `cropCycleId` narrows them to one planted crop
export const getDetections = serviceHandler(
  async (userId: string, { page = 1, limit = 10, cropCycleId }: { page?: number; limit?: number; cropCycleId?: string }) => {
    const where = { userId, ...(cropCycleId ? { cropCycleId } : {}) };
    const [total, rows] = await Promise.all([
      prisma.diseaseDetection.count({ where }),
      prisma.diseaseDetection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: detectionDetails,
      }),
    ]);
    return { items: rows.map(toDetection), meta: { page, limit, total } };
  },
);

export const getDetectionById = serviceHandler(async (id: string, userId: string) => {
  const row = await findDetection(id);
  return row && row.userId === userId ? toDetection(row) : null;
});

// Deletes one of the user's checks; returns its photo URL so the caller can remove the file, or null
export const deleteDetection = serviceHandler(async (id: string, userId: string) => {
  const row = await prisma.diseaseDetection.findFirst({ where: { id, userId }, select: { imageUrl: true } });
  if (!row) return null;

  await prisma.diseaseDetection.delete({ where: { id } });
  return row.imageUrl;
});

export const DiseaseDetectionService = {
  saveDetection,
  getDetections,
  getDetectionById,
  deleteDetection,
};
