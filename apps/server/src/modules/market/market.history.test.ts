import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@/services";
import { marketsTable, ordersTable, tradesTable, usersTable } from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { getMarketHistory } from "./market.service";

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
    .values({ username: `history_${n}`, email: `history_${n}@test.fluke` })
    .returning();
  if (!user) throw new Error("fixture failed: user");
  return user;
};

const createMarket = async () => {
  const [market] = await db
    .insert(marketsTable)
    .values({
      question: "Will the price history stay current?",
      description: "A market fixture with enough words to pass validation.",
      status: "OPEN",
      closesAt: new Date(Date.now() + 86_400_000),
    })
    .returning();
  if (!market) throw new Error("fixture failed: market");
  return market;
};

const createOrder = async (userId: string, marketId: string, side: "BID" | "ASK") => {
  const [order] = await db
    .insert(ordersTable)
    .values({ userId, marketId, side, outcome: "YES", price: 50, quantity: 1 })
    .returning();
  if (!order) throw new Error("fixture failed: order");
  return order;
};

const createTrades = async (
  marketId: string,
  count: number,
  askOrderId: string,
  bidOrderId: string,
) => {
  const base = Date.now() - count * 1000;
  const rows = Array.from({ length: count }, (_, index) => ({
    marketId,
    askOrderId,
    bidOrderId,
    outcome: "YES" as const,
    quantity: 1,
    price: 1 + (index % 99),
    createdAt: new Date(base + index * 1000),
  }));
  await db.insert(tradesTable).values(rows);
  return { base };
};

describe("getMarketHistory", () => {
  test("caps at the newest trades, not the oldest", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const market = await createMarket();
    const ask = await createOrder(seller.id, market.id, "ASK");
    const bid = await createOrder(buyer.id, market.id, "BID");
    const { base } = await createTrades(market.id, 2001, ask.id, bid.id);

    const history = await getMarketHistory(market.id);

    expect(history.trades).toBe(2000);
    expect(history.points.length).toBeLessThanOrEqual(240);
    expect(history.points.at(-1)?.t).toBe(new Date(base + 2000 * 1000).toISOString());
  });
});
