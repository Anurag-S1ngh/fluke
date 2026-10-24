import { Queue, Worker } from "bullmq";

import { sendOtpEmail } from "@fluke/email";
import {
  createConnection,
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  queueOptions,
  type SendOtpEmailPayload,
  workerOptions,
} from "@fluke/queue";

import { ENV } from "../env.server";
import { clearOtpIfCurrent } from "../otp";
import { resend } from "../services";
import { registerCloser } from "../shutdown";
import { closeExpiredMarkets } from "./close-expired-markets";
import { createSendOtpEmailProcessor } from "./send-otp-email";

const AUTO_CLOSE_INTERVAL_MS = 30_000;
const EMAIL_CONCURRENCY = 5;

const closedCount = (result: unknown): number => {
  if (typeof result !== "object" || result === null || !("closed" in result)) {
    return 0;
  }
  const { closed } = result as { closed?: unknown };
  return typeof closed === "number" ? closed : 0;
};

const attachFailureLogging = <DataType>(worker: Worker<DataType>, label: string) => {
  worker.on("failed", (job, error) => {
    console.error(`[worker] ${label} ${job?.name ?? "job"} failed`, error);
  });
  worker.on("error", (error) => {
    console.error(`[worker] ${label} worker error`, error);
  });
};

const startMaintenanceWorker = async () => {
  const queueConnection = createConnection(ENV);
  const workerConnection = createConnection(ENV);

  const maintenanceQueue = new Queue(QUEUE_NAMES.maintenance, {
    ...queueOptions(queueConnection),
    defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 3 },
  });

  const maintenanceWorker = new Worker(
    QUEUE_NAMES.maintenance,
    async (job) => {
      switch (job.name) {
        case JOB_NAMES.closeExpiredMarkets:
          return closeExpiredMarkets();
        default:
          throw new Error(`unknown maintenance job: ${job.name}`);
      }
    },
    {
      ...workerOptions(workerConnection),
      concurrency: 1,
    },
  );

  maintenanceWorker.on("completed", (job, result) => {
    console.log(`[worker] ${job.name} completed (closed ${closedCount(result)})`);
  });
  maintenanceWorker.on("stalled", (jobId) => {
    console.warn(`[worker] job ${jobId} stalled`);
  });
  attachFailureLogging(maintenanceWorker, "maintenance");

  await maintenanceQueue.upsertJobScheduler(
    "market-auto-close",
    { every: AUTO_CLOSE_INTERVAL_MS },
    {
      name: JOB_NAMES.closeExpiredMarkets,
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
      },
    },
  );

  console.log("[worker] market auto-close scheduled every 30s");

  return { maintenanceQueue, maintenanceWorker, queueConnection, workerConnection };
};

const startEmailWorker = () => {
  const workerConnection = createConnection(ENV);

  const emailWorker = new Worker<SendOtpEmailPayload>(
    QUEUE_NAMES.email,
    createSendOtpEmailProcessor({
      send: (payload) => sendOtpEmail(resend, ENV, payload.email, payload.otp),
      clearOtp: clearOtpIfCurrent,
    }),
    {
      ...workerOptions(workerConnection),
      concurrency: EMAIL_CONCURRENCY,
      limiter: { max: 10, duration: 1_000 },
    },
  );

  emailWorker.on("completed", (job) => {
    console.log(`[worker] ${job.name} sent`);
  });
  emailWorker.on("stalled", (jobId) => {
    console.warn(`[worker] email job ${jobId} stalled`);
  });
  attachFailureLogging(emailWorker, "email");

  console.log(`[worker] email worker listening (concurrency ${EMAIL_CONCURRENCY})`);

  return { emailWorker, workerConnection };
};

export const startJobs = async () => {
  const maintenance = await startMaintenanceWorker();
  const email = startEmailWorker();

  // Closers run in reverse order: workers and queues close before connections.
  registerCloser("email worker connection", () => email.workerConnection.quit());
  registerCloser("maintenance queue connection", () => maintenance.queueConnection.quit());
  registerCloser("maintenance worker connection", () => maintenance.workerConnection.quit());
  registerCloser("email worker", () => email.emailWorker.close());
  registerCloser("maintenance queue", () => maintenance.maintenanceQueue.close());
  registerCloser("maintenance worker", () => maintenance.maintenanceWorker.close());
};
