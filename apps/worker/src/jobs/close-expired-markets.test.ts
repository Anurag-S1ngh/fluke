import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { marketsTable } from "@fluke/db/schema/index";
import { eq, sql } from "drizzle-orm";

import { ENV } from "../env.server";
import { db } from "../services";
import { closeExpiredMarkets } from "./close-expired-markets";

const HOUR_MS = 60 * 60 * 1000;

const assertTestDatabase = () => {
  const dbName = new URL(ENV.DATABASE_URL).pathname.replace(/^\//, "");
  if (!dbName.endsWith("_test")) {
    throw new Error(
      `refusing to run tests against non-test database "${dbName}" — ` +
        `set DATABASE_URL to a database ending in _test`,
    );
  }
};

let seq = 0;

const createMarket = async (status: "OPEN" | "CLOSED", closesAt: Date) => {
  seq += 1;
  const [market] = await db
    .insert(marketsTable)
    .values({
      question: `Worker test market ${seq}`,
      description: "A sufficiently long description for the worker test market.",
      status,
      closesAt,
    })
    .returning();
  if (!market) throw new Error("fixture failed: market");
  return market;
};

const statusOf = async (marketId: string) => {
  const [market] = await db
    .select({ status: marketsTable.status })
    .from(marketsTable)
    .where(eq(marketsTable.id, marketId))
    .limit(1);
  return market?.status;
};

beforeAll(assertTestDatabase);

beforeEach(async () => {
  await db.execute(sql`TRUNCATE TABLE markets CASCADE`);
});

describe("closeExpiredMarkets", () => {
  test("closes only open markets whose close time has passed", async () => {
    const expired = await createMarket("OPEN", new Date(Date.now() - HOUR_MS));
    const future = await createMarket("OPEN", new Date(Date.now() + HOUR_MS));
    const alreadyClosed = await createMarket("CLOSED", new Date(Date.now() - HOUR_MS));

    const result = await closeExpiredMarkets();

    expect(result.closed).toBe(1);
    expect(result.ids).toEqual([expired.id]);
    expect(await statusOf(expired.id)).toBe("CLOSED");
    expect(await statusOf(future.id)).toBe("OPEN");
    expect(await statusOf(alreadyClosed.id)).toBe("CLOSED");
  });

  test("is idempotent across repeated sweeps", async () => {
    await createMarket("OPEN", new Date(Date.now() - HOUR_MS));

    expect((await closeExpiredMarkets()).closed).toBe(1);
    expect((await closeExpiredMarkets()).closed).toBe(0);
  });
});
