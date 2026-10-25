import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import {
  ledgerTable,
  marketsTable,
  ordersTable,
  positionsTable,
  usersTable,
} from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { getMarketForViewer, getMarketHistory, listMarkets, resolveMarket } from "./market.service";

beforeAll(assertTestDatabase);
beforeEach(resetDatabase);

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

const createUser = async (balance = 0, reservedBalance = 0, role: "USER" | "ADMIN" = "USER") => {
  const n = next();
  const [user] = await db
    .insert(usersTable)
    .values({
      username: `user_${n}`,
      email: `user_${n}@test.fluke`,
      balance,
      reservedBalance,
      role,
    })
    .returning();
  if (!user) throw new Error("fixture failed: user");
  return user;
};

const createMarket = async (status: "OPEN" | "CLOSED" | "DRAFT" = "OPEN") => {
  const [market] = await db
    .insert(marketsTable)
    .values({
      question: "Will the test suite stay green?",
      description: "A market fixture with enough words to pass validation.",
      status,
      closesAt: new Date(Date.now() + 86_400_000),
    })
    .returning();
  if (!market) throw new Error("fixture failed: market");
  return market;
};

const createPosition = async (
  userId: string,
  marketId: string,
  outcome: "YES" | "NO",
  quantity: number,
  avgPrice: number,
  reservedQuantity = 0,
) => {
  const [position] = await db
    .insert(positionsTable)
    .values({ userId, marketId, outcome, quantity, avgPrice, reservedQuantity })
    .returning();
  if (!position) throw new Error("fixture failed: position");
  return position;
};

const createOrder = async (order: {
  userId: string;
  marketId: string;
  side: "BID" | "ASK";
  outcome: "YES" | "NO";
  price: number;
  quantity: number;
  filledQuantity?: number;
  status?: "OPEN" | "PARTIALLY_FILLED" | "FILLED";
}) => {
  const [row] = await db
    .insert(ordersTable)
    .values({ filledQuantity: 0, status: "OPEN", ...order })
    .returning();
  if (!row) throw new Error("fixture failed: order");
  return row;
};

const balanceOf = async (userId: string) => {
  const [user] = await db
    .select({
      balance: usersTable.balance,
      reservedBalance: usersTable.reservedBalance,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) throw new Error("fixture failed: user lookup");
  return user;
};

const ledgerFor = (userId: string) =>
  db.select().from(ledgerTable).where(eq(ledgerTable.userId, userId));

describe("resolveMarket settlement", () => {
  test("RESOLVED pays winners qty x 100 and skips losers entirely", async () => {
    const admin = await createUser();
    const winner = await createUser();
    const loser = await createUser();
    const market = await createMarket();
    await createPosition(winner.id, market.id, "YES", 80, 40);
    await createPosition(loser.id, market.id, "NO", 50, 60);

    const updated = await resolveMarket(market.id, { outcome: "YES" }, admin.id);

    expect(updated.status).toBe("RESOLVED");
    expect(updated.outcome).toBe("YES");
    expect(updated.resolvedBy).toBe(admin.id);
    expect(updated.resolvedAt).not.toBeNull();
    expect((await balanceOf(winner.id)).balance).toBe(8000);
    expect((await balanceOf(loser.id)).balance).toBe(0);
    const winnerLedger = await ledgerFor(winner.id);
    expect(winnerLedger).toHaveLength(1);
    expect(winnerLedger[0]).toMatchObject({
      type: "PAYOUT",
      amount: 8000,
      entryDirection: "CREDIT",
    });
    expect(await ledgerFor(loser.id)).toHaveLength(0);
  });

  test("both-outcome holder is paid on the winning leg only", async () => {
    const admin = await createUser();
    const holder = await createUser();
    const market = await createMarket();
    await createPosition(holder.id, market.id, "YES", 10, 50);
    await createPosition(holder.id, market.id, "NO", 20, 50);

    await resolveMarket(market.id, { outcome: "NO" }, admin.id);

    expect((await balanceOf(holder.id)).balance).toBe(2000);
    const rows = await ledgerFor(holder.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "PAYOUT", amount: 2000 });
  });

  test("REFUND returns cost basis on both legs", async () => {
    const admin = await createUser();
    const holder = await createUser();
    const market = await createMarket();
    await createPosition(holder.id, market.id, "YES", 80, 40);
    await createPosition(holder.id, market.id, "NO", 10, 70);

    const updated = await resolveMarket(market.id, { refund: true }, admin.id);

    expect(updated.status).toBe("REFUND");
    expect(updated.outcome).toBeNull();
    expect((await balanceOf(holder.id)).balance).toBe(80 * 40 + 10 * 70);
    const rows = await ledgerFor(holder.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "REFUND", entryDirection: "CREDIT" });
  });

  test("cancelled BID remainder releases locked cash", async () => {
    const admin = await createUser();
    const trader = await createUser(1000, 600);
    const market = await createMarket();
    await createOrder({
      userId: trader.id,
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
      filledQuantity: 0,
    });

    await resolveMarket(market.id, { outcome: "YES" }, admin.id);

    const balances = await balanceOf(trader.id);
    expect(balances.balance).toBe(1600);
    expect(balances.reservedBalance).toBe(0);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.marketId, market.id));
    expect(order?.status).toBe("CANCELLED");
  });

  test("cancelled ASK remainder unlocks shares without moving them", async () => {
    const admin = await createUser();
    const trader = await createUser();
    const market = await createMarket();
    await createPosition(trader.id, market.id, "YES", 100, 40, 80);
    await createOrder({
      userId: trader.id,
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 80,
      filledQuantity: 0,
    });

    await resolveMarket(market.id, { outcome: "NO" }, admin.id);

    const [position] = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.userId, trader.id));
    expect(position?.quantity).toBe(100);
    expect(position?.reservedQuantity).toBe(0);
  });

  test("FILLED orders are left untouched by resolve", async () => {
    const admin = await createUser();
    const trader = await createUser();
    const market = await createMarket();
    const filled = await createOrder({
      userId: trader.id,
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
      filledQuantity: 10,
      status: "FILLED",
    });

    await resolveMarket(market.id, { outcome: "YES" }, admin.id);

    const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, filled.id));
    expect(row?.status).toBe("FILLED");
  });

  test("resolving a DRAFT market throws 400", async () => {
    const admin = await createUser();
    const market = await createMarket("DRAFT");

    const act = resolveMarket(market.id, { outcome: "YES" }, admin.id);

    const err = await act.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });

  test("resolving twice throws 400 on the second call", async () => {
    const admin = await createUser();
    const market = await createMarket();

    await resolveMarket(market.id, { outcome: "YES" }, admin.id);
    const second = resolveMarket(market.id, { outcome: "NO" }, admin.id);

    const err = await second.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });

  test("multiple winners are credited independently", async () => {
    const admin = await createUser();
    const alice = await createUser();
    const bob = await createUser();
    const market = await createMarket();
    await createPosition(alice.id, market.id, "YES", 10, 50);
    await createPosition(bob.id, market.id, "YES", 25, 60);

    await resolveMarket(market.id, { outcome: "YES" }, admin.id);

    expect((await balanceOf(alice.id)).balance).toBe(1000);
    expect((await balanceOf(bob.id)).balance).toBe(2500);
    expect(await ledgerFor(alice.id)).toHaveLength(1);
    expect(await ledgerFor(bob.id)).toHaveLength(1);
  });

  test("empty book resolves with status flip and no money movement", async () => {
    const admin = await createUser();
    const market = await createMarket();

    const updated = await resolveMarket(market.id, { outcome: "NO" }, admin.id);

    expect(updated.status).toBe("RESOLVED");
    const ledgerRows = await db.select().from(ledgerTable);
    expect(ledgerRows).toHaveLength(0);
  });

  test("resolved positions are stamped settled with final holdings intact", async () => {
    const admin = await createUser();
    const winner = await createUser();
    const loser = await createUser();
    const market = await createMarket();
    await createPosition(winner.id, market.id, "YES", 80, 40);
    await createPosition(loser.id, market.id, "NO", 50, 60);

    await resolveMarket(market.id, { outcome: "YES" }, admin.id);

    const rows = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.marketId, market.id));
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.settledAt).not.toBeNull();
      expect(row.reservedQuantity).toBe(0);
    }
    const winnerRow = rows.find((r) => r.userId === winner.id);
    expect(winnerRow).toMatchObject({ quantity: 80, avgPrice: 40, outcome: "YES" });
    const live = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.marketId, market.id));
    expect(live.filter((r) => r.settledAt === null)).toHaveLength(0);
  });

  test("refund stamps positions settled without touching holdings", async () => {
    const admin = await createUser();
    const holder = await createUser();
    const market = await createMarket();
    await createPosition(holder.id, market.id, "YES", 80, 40);

    await resolveMarket(market.id, { refund: true }, admin.id);

    const [row] = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.marketId, market.id));
    expect(row).toMatchObject({ quantity: 80, avgPrice: 40 });
    expect(row?.settledAt).not.toBeNull();
  });

  test("positions on other open markets stay live", async () => {
    const admin = await createUser();
    const holder = await createUser();
    const closing = await createMarket();
    const open = await createMarket();
    await createPosition(holder.id, closing.id, "YES", 10, 50);
    await createPosition(holder.id, open.id, "YES", 20, 60);

    await resolveMarket(closing.id, { outcome: "YES" }, admin.id);

    const [closedRow] = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.marketId, closing.id));
    const [openRow] = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.marketId, open.id));
    expect(closedRow?.settledAt).not.toBeNull();
    expect(openRow?.settledAt).toBeNull();
    expect(openRow?.quantity).toBe(20);
  });
});

describe("draft visibility", () => {
  test("open markets are visible to anonymous viewers", async () => {
    const market = await createMarket();

    await expect(getMarketForViewer(market.id)).resolves.toMatchObject({ id: market.id });
  });

  test("anonymous viewers cannot list drafts", async () => {
    await createMarket("DRAFT");

    await expect(listMarkets("DRAFT")).rejects.toMatchObject({ statusCode: 404 });
  });

  test("admins can list drafts", async () => {
    const admin = await createUser(0, 0, "ADMIN");
    const market = await createMarket("DRAFT");

    const markets = await listMarkets("DRAFT", admin.id);

    expect(markets.map((entry) => entry.id)).toContain(market.id);
  });

  test("drafts are hidden from anonymous viewers", async () => {
    const market = await createMarket("DRAFT");

    await expect(getMarketForViewer(market.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  test("drafts are hidden from regular users", async () => {
    const user = await createUser();
    const market = await createMarket("DRAFT");

    await expect(getMarketForViewer(market.id, user.id)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("admins can read drafts", async () => {
    const admin = await createUser(0, 0, "ADMIN");
    const market = await createMarket("DRAFT");

    await expect(getMarketForViewer(market.id, admin.id)).resolves.toMatchObject({
      id: market.id,
      status: "DRAFT",
    });
  });

  test("an unknown viewer id is treated as anonymous", async () => {
    const market = await createMarket("DRAFT");

    await expect(
      getMarketForViewer(market.id, "00000000-0000-0000-0000-000000000000"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("draft history is hidden unless the viewer is an admin", async () => {
    const admin = await createUser(0, 0, "ADMIN");
    const market = await createMarket("DRAFT");

    await expect(getMarketHistory(market.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(getMarketHistory(market.id, "ALL", admin.id)).resolves.toMatchObject({
      points: [],
      trades: 0,
    });
  });
});
