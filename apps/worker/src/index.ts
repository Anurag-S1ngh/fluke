import { set } from "@fluke/redis";

import { startJobs } from "./jobs";
import { redis } from "./services";
import { closeAll, registerCloser } from "./shutdown";

const HEARTBEAT_KEY = "worker:heartbeat";
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TTL_SECONDS = 90;

let shuttingDown = false;

const heartbeat = async () => {
  await set(
    redis,
    HEARTBEAT_KEY,
    JSON.stringify({ pid: process.pid, at: new Date().toISOString() }),
    HEARTBEAT_TTL_SECONDS,
  );
};

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[worker] ${signal} received, shutting down`);

  try {
    await closeAll();
    console.log("[worker] stopped");
    process.exit(0);
  } catch {
    process.exit(1);
  }
};

registerCloser("redis", () => redis.quit());

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

const heartbeatTimer = setInterval(() => {
  void heartbeat().catch((error: unknown) => {
    console.error("[worker] heartbeat failed", error);
  });
}, HEARTBEAT_INTERVAL_MS);
heartbeatTimer.unref();
registerCloser("heartbeat", async () => {
  clearInterval(heartbeatTimer);
});

await startJobs();
await heartbeat();
console.log(`[worker] ready (pid ${process.pid})`);
