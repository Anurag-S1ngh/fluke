import type { Job } from "bullmq";
import { type SendOtpEmailPayload, sendOtpEmailPayloadSchema } from "@fluke/queue";
import type { SendOtpEmailDeps, SendOtpEmailResult } from "../types";

export const createSendOtpEmailProcessor =
  (deps: SendOtpEmailDeps) =>
  async (job: Job<SendOtpEmailPayload>): Promise<SendOtpEmailResult> => {
    const payload = sendOtpEmailPayloadSchema.parse(job.data);
    return deps.send(payload);
  };
