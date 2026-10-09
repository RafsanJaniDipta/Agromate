import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

/**
 * Central error middleware (Masud — Day 1).
 *
 * Responsibilities:
 *  1. Translate known failure types (AppError, Zod, Prisma, JWT) into the
 *     documented error envelope with the right status code.
 *  2. Hide internals from the client in production so we never leak stack
 *     traces, SQL, or driver messages.
 *  3. Log everything once, server-side, where the team can actually see it.
 */

interface ErrorWithStatus extends Error {
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

/** Map a Zod issue onto the flat { field, message } shape the API contract uses. */
function fromZod(error: { flatten(): { fieldErrors: Record<string, string[] | undefined> } }): AppError {
  const details = Object.entries(error.flatten().fieldErrors).flatMap(([field, messages]) =>
    (messages ?? []).map((message) => ({ field, message })),
  );

  return AppError.unprocessable("Validation failed", details);
}

function fromPrisma(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case "P2002": {
      // Unique constraint — surface which field collided so forms can highlight it.
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[]).join(", ")
        : String(error.meta?.target ?? "field");

      return AppError.conflict(`A record with this ${target} already exists`);
    }
    case "P2003":
      return AppError.badRequest("Referenced record does not exist");
    case "P2007":
      // Malformed value, e.g. "abc" where a UUID is expected
      return AppError.badRequest("Invalid ID or input value");
    case "P2025":
      return AppError.notFound("Resource not found");
    default:
      return AppError.internal();
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Headers already flushed — let Express tear the connection down.
  if (res.headersSent) {
    next(err);
    return;
  }

  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    appError = fromPrisma(err);
  } else if (err?.name === "ZodError") {
    appError = fromZod(err as never);
  } else if (err?.name === "JsonWebTokenError") {
    appError = AppError.unauthorized("Invalid token");
  } else if (err?.name === "TokenExpiredError") {
    appError = AppError.unauthorized("Session expired, please log in again");
  } else if (err?.name === "MulterError") {
    // Upload problems are the client's: too big, too many files, wrong field name
    const tooBig = (err as Error & { code?: string }).code === "LIMIT_FILE_SIZE";
    appError = new AppError(tooBig ? 413 : 400, tooBig ? "Image must be 5 MB or smaller" : err.message);
  } else if (err?.name === "PrismaClientInitializationError") {
    appError = new AppError(503, "Database unavailable");
  } else {
    appError = new AppError(err?.statusCode ?? 500, env.NODE_ENV === "production" ? "Please try again later." : (err?.message ?? "Please try again later."));
  }

  const logPayload = {
    status: appError.statusCode,
    method: _req.method,
    path: _req.originalUrl,
  };

  if (appError.statusCode >= 500) {
    // The stack stays in server logs only; the client never sees it
    logger.error(appError.message, { ...logPayload, error: err });
  } else {
    logger.warn(`${appError.statusCode} ${logPayload.method} ${logPayload.path} — ${appError.message}`);
  }

  sendError(res, appError.statusCode, appError.message, appError.errors);
}