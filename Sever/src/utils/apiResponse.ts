import type { Response } from "express";

/**
 * Single source of truth for the API response envelope documented in
 * docs/API-Documentation.md.
 *
 *   success -> { success: true,  message, data }
 *   failure -> { success: false, message, errors? }
 *
 * Handlers should never call res.json() with an ad-hoc shape; use these helpers
 * so the contract stays identical on every route.
 */

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response<ApiSuccessBody<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data as T,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: ApiErrorDetail[],
): Response<ApiErrorBody> {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
  });
}