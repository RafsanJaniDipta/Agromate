import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { createSupportTicket } from "./support.service.js";

export const handleCreateSupport = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, topic, message, locale } = req.body;

  if (!name || !phone || !topic || !message) {
    sendError(res, 400, "Name, phone, topic, and message are required fields.");
    return;
  }

  const ticket = await createSupportTicket({
    name,
    phone,
    topic,
    message,
    locale,
    userId: req.user?.id,
  });

  sendSuccess(res, 201, "Support request submitted successfully.", ticket);
});

