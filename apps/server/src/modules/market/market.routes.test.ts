import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { db } from "@/services";
import { marketsTable, ordersTable, tradesTable, usersTable } from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { startServer } from "@/test/http";
import { SESSION_COOKIE, signSessionToken } from "@/util/jwt";

let server: Awaited<ReturnType<typeof startServer>>;

beforeAll(async () => {
  assertTestDatabase();
  server = await startServer();
});

afterAll(async () => {
  await server.close();
});

beforeEach(resetDatabase);

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

const createUser = async (role: "USER" | "ADMIN" = "USER") => {
  const n = next();
  const [user] = await db
    .insert(usersTable)
    .values({ username: `routes_${n}`, email: `routes_${n}@test.fluke`, role })
    .returning();
  if (!user) throw new Error("fixture failed: user");
  return user;
};

const createMarket = async (status: "OPEN" | "DRAFT" = "OPEN") => {
  const [market] = await db
    .insert(marketsTable)
    .values({
      question: "Will the route tests hold up?",
      description: "A market fixture with enough words to pass validation.",
      status,
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

const get = async (path: string, userId?: string) => {
  const token = userId ? await signSessionToken(userId) : null;
  return fetch(`${server.baseUrl}${path}`, {
    headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
  });
};

describe("GET /markets/:marketId", () => {
  test("anonymous viewers can read open markets", async () => {
    const market = await createMarket();

    const res = await get(`/markets/${market.id}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ market: { id: market.id, status: "OPEN" } });
  });

  test("drafts are hidden from anonymous viewers", async () => {
    const market = await createMarket("DRAFT");

    const res = await get(`/markets/${market.id}`);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "market not found" });
  });

  test("drafts are hidden from regular users", async () => {
    const user = await createUser();
    const market = await createMarket("DRAFT");

    const res = await get(`/markets/${market.id}`, user.id);

    expect(res.status).toBe(404);
  });

  test("admins can read drafts", async () => {
    const admin = await createUser("ADMIN");
    const market = await createMarket("DRAFT");

    const res = await get(`/markets/${market.id}`, admin.id);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ market: { id: market.id, status: "DRAFT" } });
  });

  test("malformed ids are rejected before the database", async () => {
    const res = await get("/markets/not-a-uuid");

    expect(res.status).toBe(400);
  });
});

describe("GET /markets/:marketId/history", () => {
  test("draft history is hidden from anonymous viewers", async () => {
    const market = await createMarket("DRAFT");

    const res = await get(`/markets/${market.id}/history`);

    expect(res.status).toBe(404);
  });

  test("admins can read draft history", async () => {
    const admin = await createUser("ADMIN");
    const market = await createMarket("DRAFT");

    const res = await get(`/markets/${market.id}/history`, admin.id);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ points: [], trades: 0 });
  });
});

describe("GET /markets", () => {
  test("reports the last implied YES price for each market", async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const traded = await createMarket();
    const quiet = await createMarket();
    const ask = await createOrder(seller.id, traded.id, "ASK");
    const bid = await createOrder(buyer.id, traded.id, "BID");

    await db.insert(tradesTable).values([
      {
        marketId: traded.id,
        askOrderId: ask.id,
        bidOrderId: bid.id,
        outcome: "YES",
        quantity: 1,
        price: 61,
        createdAt: new Date(Date.now() - 5_000),
      },
      {
        marketId: traded.id,
        askOrderId: ask.id,
        bidOrderId: bid.id,
        outcome: "NO",
        quantity: 1,
        price: 30,
        createdAt: new Date(),
      },
    ]);

    const res = await get("/markets?status=OPEN");

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      markets: { id: string; lastPrice: number | null }[];
    };
    expect(body.markets.find((entry) => entry.id === traded.id)?.lastPrice).toBe(70);
    expect(body.markets.find((entry) => entry.id === quiet.id)?.lastPrice).toBeNull();
  });
});

describe("GET /markets?status=DRAFT", () => {
  test("anonymous viewers cannot list drafts", async () => {
    const res = await get("/markets?status=DRAFT");

    expect(res.status).toBe(404);
  });

  test("admins can list drafts", async () => {
    const admin = await createUser("ADMIN");
    const market = await createMarket("DRAFT");

    const res = await get("/markets?status=DRAFT", admin.id);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { markets: { id: string }[] };
    expect(body.markets.map((entry) => entry.id)).toContain(market.id);
  });
});
