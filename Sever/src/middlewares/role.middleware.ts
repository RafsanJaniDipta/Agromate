import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../utils/AppError.js";

/**
 * Role-based authorisation middleware (Masud — Day 2).
 *
 * Always mount AFTER `authenticate`, otherwise req.user is empty.
 *
 *   router.delete("/:id", authenticate, authorize("admin"), controller.remove)
 *
 * Roles are strings here because the Better Auth admin plugin stores them
 * comma-separated on `user.role` (see src/config/permissions.ts).
 */
export function authorize(...allowed: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }

    const roles = req.user.role.split(",").map((role) => role.trim());

    if (!roles.some((role) => allowed.includes(role))) {
      next(
        AppError.forbidden(`This action requires one of the following roles: ${allowed.join(", ")}`),
      );
      return;
    }

    next();
  };
}

/** Convenience guards for the three product roles. */
export const adminOnly = authorize("admin");
export const farmerOnly = authorize("farmer");
export const expertOnly = authorize("expert");