import { AppError } from "./AppError.js";

/**
 * Checks a client-sent code against a Prisma enum, ignoring case.
 * Bad input becomes a 422 that lists the allowed values, instead of a Prisma 500.
 */
export function parseEnum<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
  field: string,
): T[keyof T] {
  const key = String(value).trim().toUpperCase();

  if (!Object.hasOwn(enumObject, key)) {
    throw AppError.unprocessable(`Invalid ${field}. Allowed: ${Object.values(enumObject).join(", ")}`);
  }

  return enumObject[key as keyof T];
}
