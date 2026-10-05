import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/auth.js";
import { AppError } from "../utils/AppError.js";

/**
 * Authentication middleware (Masud — Day 2).
 *
 * Better Auth validates the session cookie and returns the user. There is no
 * JWT to verify and no token to parse.
 *
 * Session cookies are cross-origin (Next.js on :3000, API on :5000), so the
 * client must send `credentials: "include"` on every fetch or this rejects.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  location?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: { id: string; expiresAt: Date };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session) {
      throw AppError.unauthorized();
    }

    // The admin plugin sets `banned`; a banned user may still hold a valid cookie.
    if (session.user.banned) {
      throw AppError.forbidden(
        session.user.banReason ?? "Account has been suspended. Contact an administrator.",
      );
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role ?? "FARMER",
      location: session.user.location,
    };
    req.session = { id: session.session.id, expiresAt: session.session.expiresAt };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Attaches the user when a valid session exists but never rejects.
 * For endpoints that are public yet can personalise their response.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (session?.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role ?? "FARMER",
        location: session.user.location,
      };
    }

    next();
  } catch {
    // An invalid or absent cookie is not an error here.
    next();
  }
}