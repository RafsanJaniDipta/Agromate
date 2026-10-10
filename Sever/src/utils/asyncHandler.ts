import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route handler so a rejected promise is forwarded to Express'
 * error middleware instead of hanging the request.
 *
 * Express 5 does forward rejected promises already, but wrapping explicitly
 * keeps handlers readable and survives a future framework downgrade.
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  handler: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}