import { startJobs } from "./jobs";
import { redis } from "./services";
import { closeAll, registerCloser } from "./shutdown";

let shuttingDown = false;

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

await startJobs();
console.log(`[worker] ready (pid ${process.pid})`);
