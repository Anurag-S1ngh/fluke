import { z } from "zod";

export const sendOtpEmailPayloadSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/, "otp must be six digits"),
});

export type SendOtpEmailPayload = z.infer<typeof sendOtpEmailPayloadSchema>;
