import { Queue } from "bullmq";

import {
  createConnection,
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  queueOptions,
  type SendOtpEmailPayload,
} from "@fluke/queue";

import { ENV } from "./env.server";

const connection = createConnection(ENV);

const emailQueue = new Queue(QUEUE_NAMES.email, {
  ...queueOptions(connection),
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const enqueueOtpEmail = async (payload: SendOtpEmailPayload) => {
  await emailQueue.add(JOB_NAMES.sendOtpEmail, payload, {
    jobId: `otp-${payload.email}-${payload.otp}`,
  });
};
