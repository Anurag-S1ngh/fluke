import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/services";
import { AppError } from "@/types/error";
import {
  ledgerTable,
  marketsTable,
  ordersTable,
  positionsTable,
  tradesTable,
  usersTable,
} from "@fluke/db/schema/index";
import { assertTestDatabase, resetDatabase } from "@/test/db";
import { cancelOrder, getOrderBook, listMyOrders, placeOrder } from "./order.service";

beforeAll(assertTestDatabase);
beforeEach(resetDatabase);

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

const createUser = async (balance = 0, reservedBalance = 0) => {
  const n = next();
  const [user] = await db
    .insert(usersTable)
    .values({
      username: `trader_${n}`,
      email: `trader_${n}@test.fluke`,
      balance,
      reservedBalance,
    })
    .returning();
  if (!user) throw new Error("fixture failed: user");
  return user;
};

const createMarket = async (
  status: "OPEN" | "CLOSED" | "DRAFT" = "OPEN",
  closesAt = new Date(Date.now() + 86_400_000),
) => {
  const [market] = await db
    .insert(marketsTable)
    .values({
      question: "Will the order book behave?",
      description: "A market fixture with enough words to pass validation.",
      status,
      closesAt,
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

const balancesOf = async (userId: string) => {
  const [user] = await db
    .select({ balance: usersTable.balance, reservedBalance: usersTable.reservedBalance })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) throw new Error("fixture failed: user lookup");
  return user;
};

const positionOf = async (userId: string, marketId: string, outcome: "YES" | "NO") => {
  const [position] = await db
    .select()
    .from(positionsTable)
    .where(eq(positionsTable.userId, userId));
  if (!position || position.marketId !== marketId || position.outcome !== outcome) {
    throw new Error("fixture failed: position lookup");
  }
  return position;
};

const capture = async (act: Promise<unknown>) => act.catch((e: unknown) => e);

describe("placeOrder", () => {
  test("BID on empty book rests OPEN with cash reserved", async () => {
    const trader = await createUser(10_000);
    const market = await createMarket();

    const { order } = await placeOrder(trader.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    expect(order.status).toBe("OPEN");
    expect(order.filledQuantity).toBe(0);
    const balances = await balancesOf(trader.id);
    expect(balances.balance).toBe(9400);
    expect(balances.reservedBalance).toBe(600);
    const [entry] = await db.select().from(ledgerTable).where(eq(ledgerTable.userId, trader.id));
    expect(entry).toMatchObject({ type: "BID", amount: 600, entryDirection: "DEBIT" });
  });

  test("BID with insufficient balance throws 400 and writes nothing", async () => {
    const trader = await createUser(100);
    const market = await createMarket();

    const err = await capture(
      placeOrder(trader.id, {
        marketId: market.id,
        side: "BID",
        outcome: "YES",
        price: 60,
        quantity: 10,
      }),
    );

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
    const orders = await db.select().from(ordersTable);
    expect(orders).toHaveLength(0);
    expect((await balancesOf(trader.id)).balance).toBe(100);
  });

  test("ASK with shares held locks them without moving quantity", async () => {
    const trader = await createUser();
    const market = await createMarket();
    await createPosition(trader.id, market.id, "YES", 100, 40);

    const { order } = await placeOrder(trader.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 80,
    });

    expect(order.status).toBe("OPEN");
    const position = await positionOf(trader.id, market.id, "YES");
    expect(position.quantity).toBe(100);
    expect(position.reservedQuantity).toBe(80);
  });

  test("ASK without enough shares throws 400 and writes nothing", async () => {
    const trader = await createUser();
    const market = await createMarket();
    await createPosition(trader.id, market.id, "YES", 10, 40);

    const err = await capture(
      placeOrder(trader.id, {
        marketId: market.id,
        side: "ASK",
        outcome: "YES",
        price: 60,
        quantity: 80,
      }),
    );

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
    const orders = await db.select().from(ordersTable);
    expect(orders).toHaveLength(0);
  });

  test("placing on a non-OPEN market throws 400", async () => {
    const trader = await createUser(10_000);
    const market = await createMarket("CLOSED");

    const err = await capture(
      placeOrder(trader.id, {
        marketId: market.id,
        side: "BID",
        outcome: "YES",
        price: 60,
        quantity: 10,
      }),
    );

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });

  test("placing past closesAt throws 400", async () => {
    const trader = await createUser(10_000);
    const market = await createMarket("OPEN", new Date(Date.now() - 1000));

    const err = await capture(
      placeOrder(trader.id, {
        marketId: market.id,
        side: "BID",
        outcome: "YES",
        price: 60,
        quantity: 10,
      }),
    );

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });
});

describe("matching engine", () => {
  test("taker BID fills against resting ASK at maker price with surplus refund", async () => {
    const seller = await createUser();
    const buyer = await createUser(100_000);
    const market = await createMarket();
    await createPosition(seller.id, market.id, "YES", 100, 40);
    const { order: ask } = await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    const { order: bid } = await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 10,
    });

    expect(bid.status).toBe("FILLED");
    expect(bid.filledQuantity).toBe(10);
    const [trade] = await db.select().from(tradesTable);
    expect(trade).toMatchObject({
      askOrderId: ask.id,
      bidOrderId: bid.id,
      marketId: market.id,
      outcome: "YES",
      quantity: 10,
      price: 60,
    });
    const buyerPosition = await positionOf(buyer.id, market.id, "YES");
    expect(buyerPosition.quantity).toBe(10);
    expect(buyerPosition.avgPrice).toBe(60);
    const sellerPosition = await positionOf(seller.id, market.id, "YES");
    expect(sellerPosition.quantity).toBe(90);
    expect(sellerPosition.reservedQuantity).toBe(0);
    const buyerBalances = await balancesOf(buyer.id);
    expect(buyerBalances.balance).toBe(100_000 - 600);
    expect(buyerBalances.reservedBalance).toBe(0);
    const sellerBalances = await balancesOf(seller.id);
    expect(sellerBalances.balance).toBe(600);
  });

  test("taker spanning two book orders persists cumulative fill (Bug 1)", async () => {
    const seller = await createUser();
    const buyer = await createUser(100_000);
    const market = await createMarket();
    await createPosition(seller.id, market.id, "YES", 200, 40);
    const { order: ask1 } = await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 60,
    });
    const { order: ask2 } = await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 60,
    });

    const { order: bid } = await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 100,
    });

    expect(bid.filledQuantity).toBe(100);
    expect(bid.status).toBe("FILLED");
    const [stored] = await db.select().from(ordersTable).where(eq(ordersTable.id, bid.id));
    expect(stored?.filledQuantity).toBe(100);
    expect(stored?.status).toBe("FILLED");
    const [storedAsk1] = await db.select().from(ordersTable).where(eq(ordersTable.id, ask1.id));
    expect(storedAsk1?.status).toBe("FILLED");
    const [storedAsk2] = await db.select().from(ordersTable).where(eq(ordersTable.id, ask2.id));
    expect(storedAsk2?.filledQuantity).toBe(40);
    expect(storedAsk2?.status).toBe("PARTIALLY_FILLED");
    const trades = await db.select().from(tradesTable);
    expect(trades).toHaveLength(2);
  });

  test("cheapest ask fills first (price-time priority)", async () => {
    const seller = await createUser();
    const buyer = await createUser(100_000);
    const market = await createMarket();
    await createPosition(seller.id, market.id, "YES", 200, 40);
    await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    const { order: cheapAsk } = await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 50,
      quantity: 10,
    });

    await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 10,
    });

    const [trade] = await db.select().from(tradesTable);
    expect(trade?.askOrderId).toBe(cheapAsk.id);
    expect(trade?.price).toBe(50);
  });

  test("own resting order is never matched (no self-trade)", async () => {
    const trader = await createUser(100_000);
    const market = await createMarket();
    await createPosition(trader.id, market.id, "YES", 100, 40);
    await placeOrder(trader.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    const { order: bid } = await placeOrder(trader.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 10,
    });

    expect(bid.status).toBe("OPEN");
    expect(bid.filledQuantity).toBe(0);
    expect(await db.select().from(tradesTable)).toHaveLength(0);
  });

  test("second buy blends avgPrice with weighted average", async () => {
    const seller = await createUser();
    const buyer = await createUser(100_000);
    const market = await createMarket();
    await createPosition(seller.id, market.id, "YES", 200, 40);
    await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 10,
    });
    await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 80,
      quantity: 10,
    });
    await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 80,
      quantity: 10,
    });

    const position = await positionOf(buyer.id, market.id, "YES");
    expect(position.quantity).toBe(20);
    expect(position.avgPrice).toBe(70);
    expect((await balancesOf(buyer.id)).balance).toBe(100_000 - 600 - 800);
  });
});

describe("cancelOrder", () => {
  test("cancelling an OPEN BID returns the full reservation", async () => {
    const trader = await createUser(10_000);
    const market = await createMarket();
    const { order } = await placeOrder(trader.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    const { order: cancelled } = await cancelOrder(trader.id, order.id);

    expect(cancelled.status).toBe("CANCELLED");
    const balances = await balancesOf(trader.id);
    expect(balances.balance).toBe(10_000);
    expect(balances.reservedBalance).toBe(0);
  });

  test("cancelling a PARTIALLY_FILLED order releases only the remainder", async () => {
    const seller = await createUser();
    const buyer = await createUser(100_000);
    const market = await createMarket();
    await createPosition(seller.id, market.id, "YES", 100, 40);
    await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    const { order: bid } = await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 20,
    });
    expect(bid.status).toBe("PARTIALLY_FILLED");

    await cancelOrder(buyer.id, bid.id);

    const balances = await balancesOf(buyer.id);
    expect(balances.balance).toBe(100_000 - 600);
    expect(balances.reservedBalance).toBe(0);
  });

  test("cancelling someone else's order throws 404", async () => {
    const owner = await createUser(10_000);
    const stranger = await createUser();
    const market = await createMarket();
    const { order } = await placeOrder(owner.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    const err = await capture(cancelOrder(stranger.id, order.id));

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 404 });
  });

  test("cancelling a FILLED order throws 400", async () => {
    const seller = await createUser();
    const buyer = await createUser(100_000);
    const market = await createMarket();
    await createPosition(seller.id, market.id, "YES", 100, 40);
    await placeOrder(seller.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    const { order: bid } = await placeOrder(buyer.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 70,
      quantity: 10,
    });
    expect(bid.status).toBe("FILLED");

    const err = await capture(cancelOrder(buyer.id, bid.id));

    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ statusCode: 400 });
  });
});

describe("listMyOrders", () => {
  test("returns own orders and scopes by marketId", async () => {
    const alice = await createUser(100_000);
    const bob = await createUser(100_000);
    const marketA = await createMarket();
    const marketB = await createMarket();
    await placeOrder(alice.id, {
      marketId: marketA.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    await placeOrder(alice.id, {
      marketId: marketB.id,
      side: "BID",
      outcome: "NO",
      price: 50,
      quantity: 5,
    });
    await placeOrder(bob.id, {
      marketId: marketA.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    expect(await listMyOrders(alice.id)).toHaveLength(2);
    expect(await listMyOrders(alice.id, marketA.id)).toHaveLength(1);
    expect(await listMyOrders(bob.id)).toHaveLength(1);
  });
});

describe("getOrderBook", () => {
  test("aggregates resting quantity by outcome, side, and price", async () => {
    const alice = await createUser(100_000);
    const bob = await createUser(100_000);
    const market = await createMarket();
    await placeOrder(alice.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    await placeOrder(bob.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 5,
    });
    await createPosition(alice.id, market.id, "NO", 10, 40);
    await placeOrder(alice.id, {
      marketId: market.id,
      side: "ASK",
      outcome: "NO",
      price: 40,
      quantity: 6,
    });

    const book = await getOrderBook(market.id);

    expect(book).toEqual(
      expect.arrayContaining([
        { side: "BID", outcome: "YES", price: 60, quantity: 15 },
        { side: "ASK", outcome: "NO", price: 40, quantity: 6 },
      ]),
    );
  });

  test("excludes filled and cancelled orders", async () => {
    const alice = await createUser(100_000);
    const market = await createMarket();
    const { order } = await placeOrder(alice.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });
    await cancelOrder(alice.id, order.id);

    expect(await getOrderBook(market.id)).toEqual([]);
  });

  test("caps each side at the requested depth", async () => {
    const alice = await createUser();
    const market = await createMarket();
    await db.insert(ordersTable).values(
      Array.from({ length: 25 }, (_, index) => ({
        userId: alice.id,
        marketId: market.id,
        side: "BID" as const,
        outcome: "YES" as const,
        price: index + 1,
        quantity: 10,
      })),
    );
    await db.insert(ordersTable).values(
      Array.from({ length: 25 }, (_, index) => ({
        userId: alice.id,
        marketId: market.id,
        side: "ASK" as const,
        outcome: "YES" as const,
        price: index + 51,
        quantity: 10,
      })),
    );

    const book = await getOrderBook(market.id);
    const bids = book.filter((level) => level.side === "BID").map((level) => level.price);
    const asks = book.filter((level) => level.side === "ASK").map((level) => level.price);

    expect(bids).toEqual(Array.from({ length: 20 }, (_, index) => 25 - index));
    expect(asks).toEqual(Array.from({ length: 20 }, (_, index) => 51 + index));
  });

  test("honors a smaller depth", async () => {
    const alice = await createUser();
    const market = await createMarket();
    await db.insert(ordersTable).values(
      Array.from({ length: 10 }, (_, index) => ({
        userId: alice.id,
        marketId: market.id,
        side: "BID" as const,
        outcome: "NO" as const,
        price: index + 1,
        quantity: 5,
      })),
    );

    const book = await getOrderBook(market.id, 5);

    expect(book.map((level) => level.price)).toEqual([10, 9, 8, 7, 6]);
  });
});

describe("order responses", () => {
  test("placeOrder returns the updated balance", async () => {
    const trader = await createUser(10_000);
    const market = await createMarket();

    const { order, balance } = await placeOrder(trader.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    expect(order.status).toBe("OPEN");
    expect(balance).toBe(9400);
    expect((await balancesOf(trader.id)).balance).toBe(balance);
  });

  test("cancelOrder returns the released balance", async () => {
    const trader = await createUser(10_000);
    const market = await createMarket();
    const { order } = await placeOrder(trader.id, {
      marketId: market.id,
      side: "BID",
      outcome: "YES",
      price: 60,
      quantity: 10,
    });

    const { balance } = await cancelOrder(trader.id, order.id);

    expect(balance).toBe(10_000);
    expect(await balancesOf(trader.id)).toMatchObject({ balance: 10_000, reservedBalance: 0 });
  });
});
