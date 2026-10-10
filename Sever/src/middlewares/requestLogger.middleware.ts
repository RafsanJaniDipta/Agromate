import type { Request, Response } from "express";
import type { RateLimitExceededEventHandler } from "express-rate-limit";
import morgan from "morgan";

import { logger, morganStream } from "../utils/logger.js";

/**
 * One log line per request, e.g.
 *   127.0.0.1 GET /api/crops 200 12.3 ms (rate limit: 298/300 left)
 */

/** Client IP as a person reads it: "::1" → "127.0.0.1", "::ffff:1.2.3.4" → "1.2.3.4". */
export function clientIp(req: Request): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  return ip === "::1" ? "127.0.0.1" : ip.replace(/^::ffff:/, "");
}

// express-rate-limit sets e.g. "RateLimit: limit=300, remaining=298, reset=877"
function rateLimitLeft(res: Response): string | undefined {
  const header = res.getHeader("RateLimit");
  const match = typeof header === "string" ? header.match(/limit=(\d+), remaining=(\d+)/) : null;
  return match ? `${match[2]}/${match[1]}` : undefined;
}

export const requestLogger = morgan(
  (tokens, req: Request, res: Response) => {
    const line = [
      clientIp(req),
      req.method,
      req.originalUrl,
      res.statusCode,
      `${tokens["response-time"]?.(req, res) ?? "-"} ms`,
    ].join(" ");

    const left = rateLimitLeft(res);
    return left ? `${line} (rate limit: ${left} left)` : line;
  },
  { stream: morganStream },
);

/** Rate limiter handler: warns who hit the limit, then sends the usual 429 message. */
export const onRateLimitReached: RateLimitExceededEventHandler = (req, res, _next, options) => {
  logger.warn(`Rate limit reached: ${clientIp(req)} ${req.method} ${req.originalUrl}`);
  res.status(options.statusCode).send(options.message);
};
