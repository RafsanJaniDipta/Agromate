import { prisma } from "../../config/database.js";
import { normalizePhoneNumber } from "../../utils/phone.js";
import { serviceHandler } from "../../utils/serviceHandler.js";

export interface CreateSupportInput {
  name: string;
  phone: string;
  topic: string;
  message: string;
  locale?: string;
  userId?: string;
}

export const createSupportTicket = serviceHandler(async (input: CreateSupportInput) => {
  const normalizedPhone = normalizePhoneNumber(input.phone);
  const locale = input.locale || "bn";

  return (prisma as any).supportTicket.create({
    data: {
      name: input.name,
      phone: normalizedPhone,
      topic: input.topic.toLowerCase(),
      message: input.message,
      locale,
      userId: input.userId,
    },
  });
});

export const SupportService = {
  createSupportTicket,
};
