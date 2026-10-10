import express, { Router } from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "../../config/auth.js";
import { handleRegister, handleLogin, listDemoLogins, handleDemoLogin } from "./auth.controller.js";

/**
 * Auth routes, mounted at /api/auth BEFORE express.json() in app.ts.
 * Rate limiting for the whole tree lives in app.ts.
 *
 * Phone flow used by the client (our { success, message, data } envelope):
 *   POST /api/auth/register   name, phone, password, locale?
 *   POST /api/auth/login      phone, password, remember? -> sets session cookie
 *   GET  /api/auth/demo-login -> demo roles offered on the login page
 *   POST /api/auth/demo-login role (farmer | expert | admin) -> sets session cookie
 *
 * Everything else falls through to Better Auth (its own response shape):
 *   POST /api/auth/sign-out
 *   GET  /api/auth/get-session
 *
 * Better Auth reads the raw body stream, so only the phone routes get a JSON parser.
 */

const parseJson = express.json({ limit: "10kb" });

export const authRouter = Router();

authRouter.post("/register", parseJson, handleRegister);
authRouter.post("/login", parseJson, handleLogin);
authRouter.get("/demo-login", listDemoLogins);
authRouter.post("/demo-login", parseJson, handleDemoLogin);

authRouter.all("/{*any}", toNodeHandler(auth));
