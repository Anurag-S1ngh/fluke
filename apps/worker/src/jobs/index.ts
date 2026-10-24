import { Worker } from "bullmq";
import { sendOtpEmail } from "@fluke/email";
import {
  createConnection,
  QUEUE_NAMES,
  type SendOtpEmailPayload,
  workerOptions,
} from "@fluke/queue";
import { ENV } from "../env.server";
import { clearOtpIfCurrent } from "../otp";
import { resend } from "../services";
import { registerCloser } from "../shutdown";
import { createSendOtpEmailProcessor } from "./send-otp-email";

const EMAIL_CONCURRENCY = 5;

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

export const startJobs = () => {
  const email = startEmailWorker();

  registerCloser("email worker connection", () => email.workerConnection.quit());
  registerCloser("email worker", () => email.emailWorker.close());
};
