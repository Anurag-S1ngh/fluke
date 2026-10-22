import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@/services";
import { marketsTable, positionsTable, usersTable } from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { listPositions } from "./position.service";

beforeAll(assertTestDatabase);
beforeEach(resetDatabase);

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

const createUser = async () => {
  const n = next();
  const [user] = await db
    .insert(usersTable)
    .values({ username: `holder_${n}`, email: `holder_${n}@test.fluke` })
    .returning();
  if (!user) throw new Error("fixture failed: user");
  return user;
};

const createMarket = async (
  question: string,
  status: "OPEN" | "RESOLVED" = "OPEN",
  outcome: "YES" | "NO" | null = null,
) => {
  const [market] = await db
    .insert(marketsTable)
    .values({
      question,
      description: "A market fixture with enough words to pass validation.",
      status,
      outcome,
      resolvedAt: status === "RESOLVED" ? new Date("2026-10-01T00:00:00.000Z") : null,
      closesAt: new Date("2026-10-21T00:00:00.000Z"),
    })
    .returning();
  if (!market) throw new Error("fixture failed: market");
  return market;
};

describe("listPositions", () => {
  test("joins market details and returns live positions before settled ones", async () => {
    const user = await createUser();
    const liveMarket = await createMarket("Is the live position first?");
    const settledMarket = await createMarket("Did the settled position pay?", "RESOLVED", "YES");

    await db.insert(positionsTable).values({
      userId: user.id,
      marketId: liveMarket.id,
      outcome: "YES",
      quantity: 20,
      reservedQuantity: 5,
      avgPrice: 60,
    });
    await db.insert(positionsTable).values({
      userId: user.id,
      marketId: settledMarket.id,
      outcome: "YES",
      quantity: 10,
      avgPrice: 50,
      settledAt: new Date("2026-10-01T00:00:00.000Z"),
    });

    const positions = await listPositions(user.id);

    expect(positions).toHaveLength(2);
    expect(positions[0]).toMatchObject({
      marketId: liveMarket.id,
      question: "Is the live position first?",
      status: "OPEN",
      marketOutcome: null,
      outcome: "YES",
      quantity: 20,
      reservedQuantity: 5,
      avgPrice: 60,
      settledAt: null,
    });
    expect(positions[1]).toMatchObject({
      marketId: settledMarket.id,
      question: "Did the settled position pay?",
      status: "RESOLVED",
      marketOutcome: "YES",
      settledAt: new Date("2026-10-01T00:00:00.000Z"),
    });
  });

  test("only returns the requested user's positions", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const market = await createMarket("Whose position is this?");

    await db.insert(positionsTable).values({
      userId: alice.id,
      marketId: market.id,
      outcome: "NO",
      quantity: 4,
      avgPrice: 25,
    });
    await db.insert(positionsTable).values({
      userId: bob.id,
      marketId: market.id,
      outcome: "YES",
      quantity: 4,
      avgPrice: 25,
    });

    const positions = await listPositions(alice.id);

    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({ outcome: "NO", quantity: 4 });
  });
});
