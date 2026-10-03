import { Router } from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "../../config/auth.js";

/**
 * Better Auth route mount (Masud — Day 2).
 *
 * Handles the entire /api/auth/* surface:
 *   POST /api/auth/sign-up/email   register
 *   POST /api/auth/sign-in/email   login
 *   POST /api/auth/sign-out        logout
 *   GET  /api/auth/get-session     "me"
 *
 * IMPORTANT — ordering. This handler must be mounted BEFORE express.json() in
 * app.ts. It needs the raw request stream; if a body parser runs first the
 * stream is already consumed and every auth call hangs or 400s.
 *
 * Response shape note: these routes do NOT use our { success, message, data }
 * envelope — Better Auth returns its own contract ({ user, token } etc).
 * The client must handle both. Everything else in the API uses the envelope.
 */

import { handleRegister, handleLogin } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", handleRegister);
authRouter.post("/login", handleLogin);

authRouter.all("/{*any}", toNodeHandler(auth));