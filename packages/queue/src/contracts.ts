import { z } from "zod";

export const closeExpiredMarketsPayloadSchema = z.object({
  version: z.literal(1),
});

export type CloseExpiredMarketsPayload = z.infer<typeof closeExpiredMarketsPayloadSchema>;

export const sendOtpEmailPayloadSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/, "otp must be six digits"),
});

export type SendOtpEmailPayload = z.infer<typeof sendOtpEmailPayloadSchema>;
