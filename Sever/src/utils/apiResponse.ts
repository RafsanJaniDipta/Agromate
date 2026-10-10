import type { Response } from "express";
import type { ApiErrorBody, ApiErrorDetail, ApiSuccessBody } from "../types/index.js";

export type { ApiErrorBody, ApiErrorDetail, ApiSuccessBody };


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

export function sendPaginatedSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T[],
  meta: { page: number; limit: number; total: number },
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
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