import { AppError } from "./AppError.js";

/**
 * Higher-Order Function (HOF) wrapper for async Service functions.
 * Wraps service database operations to convert raw Prisma/database errors cleanly into AppError.
 */
export const serviceHandler = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      // Prisma P2025: Record to update/delete not found
      if (error.code === "P2025") {
        throw AppError.notFound("Requested resource was not found");
      }
      // Prisma P2002: Unique constraint failed
      if (error.code === "P2002") {
        const fields = error.meta?.target ? String(error.meta.target) : "field";
        throw AppError.conflict(`A record with this ${fields} already exists`);
      }
      // Prisma P2007: Malformed value, e.g. "abc" where a UUID is expected
      if (error.code === "P2007") {
        throw AppError.badRequest("Invalid ID or input value");
      }
      // Let the error middleware log the original and hide its message in production
      throw error;
    }
  }) as T;
};
