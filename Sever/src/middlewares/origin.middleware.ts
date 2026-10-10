import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard. The session cookie rides along on cross-site requests in
 * production (SameSite=None), so a request that changes data must come from
 * one of our own front-ends. Browsers always send Origin on such requests;
 * when it is missing (curl, Postman, server-to-server) there is no browser
 * cookie to abuse, so the request is let through.
 */
export function requireTrustedOrigin(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins);

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    // Some older browsers send only Referer; its origin part is what matters
    const origin = req.get("origin") ?? originOf(req.get("referer"));

    if (origin && !allowed.has(origin)) {
      next(AppError.forbidden("Request origin is not allowed"));
      return;
    }

    next();
  };
}

function originOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
