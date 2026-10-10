import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/auth.js";
import { AppError } from "../utils/AppError.js";
import type { AuthUser } from "../types/index.js";


/**
 * Reads the session from the request cookie. When Better Auth extends a
 * "remember me" session (at most once a day) it also issues a fresh cookie;
 * that Set-Cookie is passed on so the browser's cookie is extended too.
 * Without it the database session would live on while the browser's cookie
 * still expired 7 days after login.
 */
async function loadSession(req: Request, res: Response) {
  const { headers, response: session } = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
    returnHeaders: true,
  });

  const cookies = headers.getSetCookie();
  if (cookies.length) {
    res.append("Set-Cookie", cookies);
  }

  return session;
}

type Session = NonNullable<Awaited<ReturnType<typeof loadSession>>>;

const toAuthUser = ({ user }: Session): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role ?? "FARMER",
  location: user.location,
});

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await loadSession(req, res);

    if (!session) {
      throw AppError.unauthorized();
    }

    // The admin plugin sets `banned`; a banned user may still hold a valid cookie.
    if (session.user.banned) {
      throw AppError.forbidden(
        session.user.banReason ?? "Account has been suspended. Contact an administrator.",
      );
    }

    req.user = toAuthUser(session);
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
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await loadSession(req, res);

    if (session) {
      req.user = toAuthUser(session);
    }

    next();
  } catch {
    // An invalid or absent cookie is not an error here.
    next();
  }
}