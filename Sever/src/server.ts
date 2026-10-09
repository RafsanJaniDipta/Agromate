import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, describeDatabase, disconnectDatabase } from "./config/database.js";
import { setupSocketIO } from "./socket/socket.server.js";
import { startPriceUpdates } from "./modules/price/price.scheduler.js";
import { logger } from "./utils/logger.js";

/**
 * Process entrypoint (Masud — Day 1).
 *
 * Verifies the database is reachable before binding the port, so a bad
 * DATABASE_URL fails immediately and loudly instead of on the first query.
 */

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    logger.info(`✅ Database connected successfully → ${describeDatabase()}`);
  } catch (error) {
    logger.error(`❌ Database connection failed → ${describeDatabase()} (check DATABASE_URL in .env)`, error);
    process.exit(1);
  }

  const app = createApp();
  const server = createServer(app);
  // Live chat and notifications share the API's port
  setupSocketIO(server);

  server.listen(env.PORT, () => {
    // Daily TCB prices and the built-in price list
    startPriceUpdates();
    logger.info(`[api] AgroMate server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    logger.info(`[api] ${signal} received, shutting down`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    // Don't hang forever if a connection refuses to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    logger.error("[api] unhandled rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    logger.error("[api] uncaught exception", error);
    process.exit(1);
  });
}

void bootstrap();