import { db } from "@/services";
import { ENV } from "@/env.server";
import { sql } from "drizzle-orm";

// Test-only database utilities. Never import from application code.

export const assertTestDatabase = () => {
  const dbName = new URL(ENV.DATABASE_URL).pathname.replace(/^\//, "");
  if (!dbName.endsWith("_test")) {
    throw new Error(
      `refusing to run tests against non-test database "${dbName}" — ` +
        `set DATABASE_URL to a database ending in _test`,
    );
  }
};

export const resetDatabase = async () => {
  await db.execute(sql`TRUNCATE TABLE users, markets, orders, trades, positions, ledger CASCADE`);
};
