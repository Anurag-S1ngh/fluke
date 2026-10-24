import { Queue, Worker } from "bullmq";

import {
  closeExpiredMarketsPayloadSchema,
  createConnection,
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  queueOptions,
  workerOptions,
} from "@fluke/queue";

import { ENV } from "../env.server";
import { registerCloser } from "../shutdown";
import { closeExpiredMarkets } from "./close-expired-markets";

const AUTO_CLOSE_INTERVAL_MS = 30_000;

const closedCount = (result: unknown): number => {
  if (typeof result !== "object" || result === null || !("closed" in result)) {
    return 0;
  }
  const { closed } = result as { closed?: unknown };
  return typeof closed === "number" ? closed : 0;
};

export const startJobs = async () => {
  const queueConnection = createConnection(ENV);
  const workerConnection = createConnection(ENV);

  const maintenanceQueue = new Queue(QUEUE_NAMES.maintenance, {
    ...queueOptions(queueConnection),
    defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 3 },
  });

  const maintenanceWorker = new Worker(
    QUEUE_NAMES.maintenance,
    async (job) => {
      closeExpiredMarketsPayloadSchema.parse(job.data);

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
  maintenanceWorker.on("failed", (job, error) => {
    console.error(`[worker] ${job?.name ?? "job"} failed`, error);
  });
  maintenanceWorker.on("stalled", (jobId) => {
    console.warn(`[worker] job ${jobId} stalled`);
  });
  maintenanceWorker.on("error", (error) => {
    console.error("[worker] maintenance worker error", error);
  });

  await maintenanceQueue.upsertJobScheduler(
    "market-auto-close",
    { every: AUTO_CLOSE_INTERVAL_MS },
    {
      name: JOB_NAMES.closeExpiredMarkets,
      data: { version: 1 },
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
      },
    },
  );

  registerCloser("maintenance queue connection", () => queueConnection.quit());
  registerCloser("maintenance worker connection", () => workerConnection.quit());
  registerCloser("maintenance queue", () => maintenanceQueue.close());
  registerCloser("maintenance worker", () => maintenanceWorker.close());

  console.log("[worker] market auto-close scheduled every 30s");
};
