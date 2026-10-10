import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";

/**
 * Role-based authorisation middleware.
 *
 * Always mount AFTER `authenticate`, otherwise req.user is empty.
 *
 * Checks allowed roles case-insensitively.
 */
export function authorize(...allowed: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }

    const userRole = (req.user.role || "").toUpperCase();
    const userRoles = userRole.split(",").map((r) => r.trim());
    const allowedUpper = allowed.map((a) => a.toUpperCase());

    if (!userRoles.some((role) => allowedUpper.includes(role))) {
      next(
        AppError.forbidden(`This action requires one of the following roles: ${allowed.join(", ")}`),
      );
      return;
    }

    next();
  };
}

/** Verified Expert check middleware */
export async function verifiedExpertOnly(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next(AppError.unauthorized());
    return;
  }

  const userRole = (req.user.role || "").toUpperCase();
  if (!userRole.includes("EXPERT") && !userRole.includes("ADMIN")) {
    next(AppError.forbidden("Access denied. Verified Expert role required."));
    return;
  }

  if (userRole.includes("ADMIN")) {
    next();
    return;
  }

  try {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile || profile.status !== "VERIFIED") {
      next(AppError.forbidden("Your expert profile is not verified yet."));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/** Convenience guards for the product roles. */
export const adminOnly = authorize("ADMIN", "admin");
export const farmerOnly = authorize("FARMER", "farmer");
export const expertOnly = authorize("EXPERT", "expert");