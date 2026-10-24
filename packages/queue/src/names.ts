import type { JobsOptions } from "bullmq";
import type { RedisClient } from "@fluke/redis";

export const QUEUE_PREFIX = "fluke";

export const QUEUE_NAMES = {
  email: "email",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const JOB_NAMES = {
  sendOtpEmail: "send-otp-email",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
};

export const queueOptions = (connection: RedisClient) => ({
  connection,
  prefix: QUEUE_PREFIX,
});

export const workerOptions = (connection: RedisClient) => ({
  connection,
  prefix: QUEUE_PREFIX,
});
