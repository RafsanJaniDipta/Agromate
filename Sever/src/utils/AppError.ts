/**
 * Operational error carrying an HTTP status code.
 *
 * Throwing `AppError` from any layer (controller, service, Prisma wrapper) is
 * how a route signals a *deliberate* failure. The error middleware turns these
 * into a clean client response; anything that is not an AppError is treated as
 * an unexpected bug and hidden behind a generic message.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", errors?: Array<{ field: string; message: string }>) {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(401, message);
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new AppError(404, message);
  }

  static conflict(message = "Resource already exists") {
    return new AppError(409, message);
  }

  static unprocessable(message = "Validation failed", errors?: Array<{ field: string; message: string }>) {
    return new AppError(422, message, errors);
  }

  static internal(message = "Please try again later.") {
    return new AppError(500, message);
  }

  /** Upstream failure (AI provider, weather API) with a safe public message. */
  static badGateway(message = "Upstream service unavailable") {
    return new AppError(502, message);
  }
}