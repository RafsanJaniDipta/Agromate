import { prisma } from "../../config/database.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateDiseaseDetectionInput {
  userId: string;
  image?: string;
  imageUrl?: string;
  cropId?: string;
}

export const createDetection = serviceHandler(async (data: CreateDiseaseDetectionInput) => {
  const img = data.image ?? data.imageUrl ?? "";

  const mockResult = {
    diseaseName: "Early Blight (Alternaria solani)",
    confidence: 0.94,
    description: "Early blight is a common fungal disease affecting foliage, stems, and fruits.",
    treatmentRecommendations: [
      "Apply copper-based fungicides every 7-10 days",
      "Prune affected lower leaves to improve airflow",
    ],
    preventionTips: [
      "Rotate crops every 2-3 years",
      "Avoid overhead irrigation to keep leaves dry",
    ],
  };

  const detection = await prisma.diseaseDetection.create({
    data: {
      userId: data.userId,
      cropId: data.cropId,
      imageUrl: img,
      detectedDisease: mockResult.diseaseName,
      confidenceScore: mockResult.confidence,
      recommendations: JSON.stringify({
        description: mockResult.description,
        treatmentRecommendations: mockResult.treatmentRecommendations,
        preventionTips: mockResult.preventionTips,
      }),
    } as any,
  });

  return {
    id: detection.id,
    cropId: (detection as any).cropId ?? data.cropId,
    imageUrl: detection.imageUrl,
    diseaseName: detection.detectedDisease,
    confidence: detection.confidenceScore,
    description: mockResult.description,
    treatmentRecommendations: mockResult.treatmentRecommendations,
    preventionTips: mockResult.preventionTips,
    createdAt: detection.createdAt,
  };
});

export const getDetections = serviceHandler(async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  const where = { userId };

  const [total, items] = await Promise.all([
    prisma.diseaseDetection.count({ where }),
    prisma.diseaseDetection.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedItems = items.map((item) => {
    let parsedRec: any = {};
    try {
      parsedRec = item.recommendations ? JSON.parse(item.recommendations) : {};
    } catch {
      parsedRec = { description: item.recommendations };
    }

    return {
      id: item.id,
      cropId: (item as any).cropId,
      imageUrl: item.imageUrl,
      diseaseName: item.detectedDisease,
      confidence: item.confidenceScore,
      description: parsedRec.description || "",
      treatmentRecommendations: parsedRec.treatmentRecommendations || [],
      preventionTips: parsedRec.preventionTips || [],
      createdAt: item.createdAt,
    };
  });

  return {
    items: formattedItems,
    meta: { page, limit, total },
  };
});

export const getDetectionById = serviceHandler(async (id: string, userId: string) => {
  const item = await prisma.diseaseDetection.findUnique({
    where: { id },
  });

  if (!item || item.userId !== userId) {
    return null;
  }

  let parsedRec: any = {};
  try {
    parsedRec = item.recommendations ? JSON.parse(item.recommendations) : {};
  } catch {
    parsedRec = { description: item.recommendations };
  }

  return {
    id: item.id,
    cropId: (item as any).cropId,
    imageUrl: item.imageUrl,
    diseaseName: item.detectedDisease,
    confidence: item.confidenceScore,
    description: parsedRec.description || "",
    treatmentRecommendations: parsedRec.treatmentRecommendations || [],
    preventionTips: parsedRec.preventionTips || [],
    createdAt: item.createdAt,
  };
});

export const DiseaseDetectionService = {
  createDetection,
  getDetections,
  getDetectionById,
};
