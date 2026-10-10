import { Router } from "express";

import { prisma } from "../../config/database.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";

/**
 * Health check (Masud — Day 1 deliverable).
 *
 * GET /api/health — public, used by Rahul's smoke tests and by the deployment
 * platform to decide whether the container is live. Also reports database
 * reachability so a green response actually means the app can serve traffic.
 */

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    let database: "up" | "down" = "up";
    const startedAt = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "down";
    }

    const healthy = database === "up";

    sendSuccess(
      res,
      healthy ? 200 : 503,
      healthy ? "AgroMate API is healthy" : "AgroMate API is running but the database is unreachable",
      {
        status: healthy ? "ok" : "degraded",
        environment: process.env.NODE_ENV ?? "development",
        database,
        responseTimeMs: Date.now() - startedAt,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    );
  }),
);