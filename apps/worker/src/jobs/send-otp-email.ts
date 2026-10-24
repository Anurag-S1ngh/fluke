import type { Job } from "bullmq";
import { type SendOtpEmailPayload, sendOtpEmailPayloadSchema } from "@fluke/queue";

export type SendOtpEmailResult = {
  id: string;
};

type SendOtpEmailDeps = {
  send: (payload: SendOtpEmailPayload) => Promise<SendOtpEmailResult>;
  clearOtp: (email: string, otp: string) => Promise<void>;
};

export const createSendOtpEmailProcessor =
  (deps: SendOtpEmailDeps) =>
  async (job: Job<SendOtpEmailPayload>): Promise<SendOtpEmailResult> => {
    const payload = sendOtpEmailPayloadSchema.parse(job.data);

    try {
      return await deps.send(payload);
    } catch (error) {
      const attempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= attempts;
      if (isFinalAttempt) {
        try {
          await deps.clearOtp(payload.email, payload.otp);
        } catch (clearError) {
          console.error("[worker] failed to clear OTP after email failure", clearError);
        }
      }
      throw error;
    }
  };
