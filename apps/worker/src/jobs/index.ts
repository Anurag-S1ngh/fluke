import { Queue, Worker } from "bullmq";
import { sendOtpEmail } from "@fluke/email";
import {
  createConnection,
  DEFAULT_JOB_OPTIONS,
  JOB_NAMES,
  QUEUE_NAMES,
  type SendOtpEmailPayload,
  queueOptions,
  workerOptions,
} from "@fluke/queue";
import { ENV } from "../env.server";
import { db, resend } from "../services";
import { registerCloser } from "../shutdown";
import { createCloseExpiredMarketsProcessor } from "./close-expired-markets";
import { createSendOtpEmailProcessor } from "./send-otp-email";

const EMAIL_CONCURRENCY = 5;
const MARKET_SWEEP_INTERVAL_MS = 60_000;

const attachFailureLogging = <DataType>(worker: Worker<DataType>, label: string) => {
  worker.on("failed", (job, error) => {
    console.error(`[worker] ${label} ${job?.name ?? "job"} failed`, error);
  });
  worker.on("error", (error) => {
    console.error(`[worker] ${label} worker error`, error);
  });
};

const startEmailWorker = () => {
  const workerConnection = createConnection(ENV);

  const emailWorker = new Worker<SendOtpEmailPayload>(
    QUEUE_NAMES.email,
    createSendOtpEmailProcessor({
      send: (payload) => sendOtpEmail(resend, ENV, payload.email, payload.otp),
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

const startMarketWorker = async () => {
  const processor = createCloseExpiredMarketsProcessor(db);
  try {
    await processor();
  } catch (error) {
    console.error("[worker] initial market sweep failed", error);
  }

  const queueConnection = createConnection(ENV);
  const queue = new Queue(QUEUE_NAMES.market, queueOptions(queueConnection));

  await queue.upsertJobScheduler(
    JOB_NAMES.closeExpiredMarkets,
    { every: MARKET_SWEEP_INTERVAL_MS },
    {
      name: JOB_NAMES.closeExpiredMarkets,
      opts: DEFAULT_JOB_OPTIONS,
    },
  );

  const workerConnection = createConnection(ENV);
  const marketWorker = new Worker(QUEUE_NAMES.market, processor, {
    ...workerOptions(workerConnection),
    concurrency: 1,
  });

  marketWorker.on("stalled", (jobId) => {
    console.warn(`[worker] market job ${jobId} stalled`);
  });
  attachFailureLogging(marketWorker, "market");

  console.log(`[worker] market worker listening (every ${MARKET_SWEEP_INTERVAL_MS}ms)`);

  return { marketWorker, workerConnection, queue, queueConnection };
};

export const startJobs = async () => {
  const email = startEmailWorker();
  const market = await startMarketWorker();

  registerCloser("email worker connection", () => email.workerConnection.quit());
  registerCloser("email worker", () => email.emailWorker.close());
  registerCloser("market queue connection", () => market.queueConnection.quit());
  registerCloser("market queue", () => market.queue.close());
  registerCloser("market worker connection", () => market.workerConnection.quit());
  registerCloser("market worker", () => market.marketWorker.close());
};
