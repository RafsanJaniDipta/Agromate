import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny, z } from "zod";

import { AppError } from "../utils/AppError.js";

/**
 * Zod-backed validation middleware (Masud — Day 1).
 *
 * Usage:
 *   router.post("/farms", validate({ body: createFarmSchema }), controller.create)
 *
 * A successful parse *replaces* the raw input with the parsed output, so
 * controllers receive coerced, typed, stripped-of-unknown-keys values and never
 * need to re-validate. On failure the request short-circuits with 422 and the
 * `{ field, message }` array from the API contract.
 */

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      if (schemas.query) {
        // Express 5 exposes req.query via a getter, so assign the parsed value
        // onto a fresh property rather than mutating in place.
        const parsedQuery = schemas.query.parse(req.query) as Record<string, unknown>;
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Convenience helper so controllers can re-parse an already-validated payload. */
export function parseOrThrow<T extends ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw AppError.unprocessable(
      "Validation failed",
      result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    );
  }

  return result.data;
}