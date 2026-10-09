import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { requireTrustedOrigin } from "./middlewares/origin.middleware.js";
import { onRateLimitReached, requestLogger } from "./middlewares/requestLogger.middleware.js";

/**
 * Express application assembly (Masud — Day 1).
 *
 * Kept separate from server.ts so the app can be imported by tests without
 * binding a port.
 */

export function createApp(): Application {
  const app = express();

  // The client front-ends allowed to call this API with the user's cookie
  const clientOrigins = Array.from(
    new Set([
      "http://localhost:3000",
      "http://localhost:5000",
      ...env.CLIENT_URL.split(",").map((origin) => origin.trim()),
    ]),
  );

  // Trust the first proxy hop so rate limiting sees real client IPs in production.
  app.set("trust proxy", 1);

  // First, so every request is logged: auth calls and blocked ones too
  app.use(requestLogger);

  app.use(helmet());
  app.use(
    cors({
      origin: clientOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  // Before every route, including auth, so no cookie-backed change can come from another site
  app.use("/api", requireTrustedOrigin(clientOrigins));

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: process.env.NODE_ENV === "production" ? 5 : 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: onRateLimitReached,
      // Guards against password guessing, so only sign-in style requests count. Reads (the
      // session check, the login page's list of demo accounts) mustn't hide the page's buttons.
      skip: (req) => req.method === "GET",
      message: {
        success: false,
        message: "Too many authentication attempts, please try again later.",
      },
    }),
  );

  // Better Auth MUST come before any body parser. It reads the raw request
  // stream itself; express.json() consumes it first and auth calls then hang.
  // Phone register/login parse their own JSON; everything else is Better Auth.
  app.use("/api/auth", authRouter);

  // JSON only: HTML forms can't send it cross-site without a CORS preflight
  app.use(express.json({ limit: "1mb" }));
  // Express 5 leaves req.body undefined for other content types; handlers expect an object
  app.use((req, _res, next) => {
    req.body ??= {};
    next();
  });

  // Non-auth API routes use this broad limit; auth is limited before its handler above.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: onRateLimitReached,
      message: {
        success: false,
        message: "Too many requests, please try again later.",
      },
    }),
  );

  // All feature routers are mounted under /api (e.g. /api/health, /api/farms).
  app.use("/api", routes);

  // Order matters: unmatched route first, then the single error boundary.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
