import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";

import { env, isProduction } from "./config/env.js";
import { auth } from "./config/auth.js";
import { routes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

/**
 * Express application assembly (Masud — Day 1).
 *
 * Kept separate from server.ts so the app can be imported by tests without
 * binding a port.
 */

export function createApp(): Application {
  const app = express();

  // Trust the first proxy hop so rate limiting sees real client IPs in production.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: isProduction ? env.CLIENT_URL.split(",").map((o) => o.trim()) : true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many authentication attempts, please try again later.",
      },
    }),
  );

  // Better Auth MUST come before any body parser. It reads the raw request
  // stream itself; express.json() consumes it first and auth calls then hang.
  // Mounted at the root because the handler owns the whole /api/auth/* tree.
  app.all("/api/auth/{*any}", toNodeHandler(auth));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  if (!isProduction) {
    app.use(morgan("dev"));
  }

  // Non-auth API routes use this broad limit; auth is limited before its handler above.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
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