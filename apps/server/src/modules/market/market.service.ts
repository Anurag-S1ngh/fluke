import { db } from "@/services";
import { AppError } from "@/types/error";
import { expireMarket, expireMarkets } from "@fluke/db/markets";
import {
  ledgerTable,
  marketsTable,
  ordersTable,
  positionsTable,
  tradesTable,
  usersTable,
} from "@fluke/db/schema/index";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { assertCanViewDraft } from "./market.access";
import type { HistoryRange, MarketOutcome, MarketStatus, ResolveMarketInput } from "./market.types";

export const listMarkets = async (status: MarketStatus = "OPEN", viewerId?: string) => {
  if (status === "DRAFT") {
    await assertCanViewDraft(viewerId);
  } else {
    await expireMarkets(db);
  }
  return db
    .select()
    .from(marketsTable)
    .where(eq(marketsTable.status, status))
    .orderBy(desc(marketsTable.createdAt));
};

export const getMarketById = async (marketId: string) => {
  const [market] = await db
    .select()
    .from(marketsTable)
    .where(eq(marketsTable.id, marketId))
    .limit(1);
  if (!market) {
    throw new AppError("market not found", 404);
  }
  return market;
};

export const getMarketForViewer = async (marketId: string, viewerId?: string) => {
  let market = await getMarketById(marketId);
  if (market.status === "OPEN" && market.closesAt <= new Date()) {
    const closed = await expireMarket(db, marketId);
    if (closed) {
      market = closed;
    }
  }
  if (market.status === "DRAFT") {
    await assertCanViewDraft(viewerId);
  }
  return market;
};

const HISTORY_RANGE_MS: Record<HistoryRange, number | null> = {
  "1H": 60 * 60 * 1000,
  "6H": 6 * 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  ALL: null,
};

const MAX_HISTORY_POINTS = 240;
const HISTORY_TRADE_LIMIT = 2000;

const downsample = <T>(points: T[], max: number): T[] => {
  if (points.length <= max) {
    return points;
  }

  const step = points.length / max;
  const sampled: T[] = [];
  for (let index = 0; index < max; index += 1) {
    const end = Math.min(points.length - 1, Math.floor((index + 1) * step) - 1);
    const point = points[end];
    if (point !== undefined) {
      sampled.push(point);
    }
  }
  return sampled;
};

/**
 * Price history for the chart. Every trade is converted to the implied YES
 * price (a NO fill at p means YES traded at 100 - p).
 */
export const getMarketHistory = async (
  marketId: string,
  range: HistoryRange = "ALL",
  viewerId?: string,
) => {
  await getMarketForViewer(marketId, viewerId);

  const span = HISTORY_RANGE_MS[range];
  const since = span === null ? null : new Date(Date.now() - span);

  const trades = await db
    .select({
      createdAt: tradesTable.createdAt,
      price: tradesTable.price,
      outcome: tradesTable.outcome,
      quantity: tradesTable.quantity,
    })
    .from(tradesTable)
    .where(
      since
        ? and(eq(tradesTable.marketId, marketId), gte(tradesTable.createdAt, since))
        : eq(tradesTable.marketId, marketId),
    )
    .orderBy(desc(tradesTable.createdAt))
    .limit(HISTORY_TRADE_LIMIT);

  const ordered = [...trades].reverse();

  const allPoints = ordered.map((trade) => ({
    t: trade.createdAt.toISOString(),
    yes: trade.outcome === "YES" ? trade.price : 100 - trade.price,
  }));

  const volume = ordered.reduce((total, trade) => total + trade.price * trade.quantity, 0);

  return {
    points: downsample(allPoints, MAX_HISTORY_POINTS),
    volume,
    trades: ordered.length,
  };
};

export const createMarket = async (input: {
  question: string;
  description: string;
  closesAt: Date;
  publish?: boolean;
}) => {
  const status = input.publish ? "OPEN" : "DRAFT";
  const [created] = await db
    .insert(marketsTable)
    .values({
      question: input.question,
      description: input.description,
      closesAt: input.closesAt,
      status,
    })
    .returning();
  if (!created) {
    throw new AppError("failed to create market", 500);
  }
  return created;
};

export const publishMarket = async (marketId: string) => {
  const market = await getMarketById(marketId);
  if (market.status !== "DRAFT") {
    throw new AppError("only draft markets can be published", 400);
  }
  if (market.closesAt.getTime() <= Date.now()) {
    throw new AppError("closesAt must be in the future", 400);
  }
  const [updated] = await db
    .update(marketsTable)
    .set({ status: "OPEN", updatedAt: new Date() })
    .where(eq(marketsTable.id, marketId))
    .returning();
  if (!updated) {
    throw new AppError("market not found", 404);
  }
  return updated;
};

export const closeMarket = async (marketId: string) => {
  const market = await getMarketById(marketId);
  if (market.status !== "OPEN") {
    throw new AppError("only open markets can be closed", 400);
  }
  const [updated] = await db
    .update(marketsTable)
    .set({ status: "CLOSED", updatedAt: new Date() })
    .where(eq(marketsTable.id, marketId))
    .returning();
  if (!updated) {
    throw new AppError("market not found", 404);
  }
  return updated;
};

export const resolveMarket = async (
  marketId: string,
  input: ResolveMarketInput,
  adminId: string,
) => {
  const resolvableStatuses: MarketStatus[] = ["OPEN", "CLOSED"];
  const cancellableOrderStatuses: Array<typeof ordersTable.$inferSelect.status> = [
    "OPEN",
    "PARTIALLY_FILLED",
  ];
  const market = await getMarketById(marketId);
  if (!resolvableStatuses.includes(market.status)) {
    throw new AppError("market cannot be resolved in current state", 400);
  }
  const isRefund = input.refund === true;
  const status = isRefund ? "REFUND" : "RESOLVED";
  const outcome = isRefund ? null : (input.outcome ?? null);
  const now = new Date();
  const PAYOUT_PER_SHARE = 100; // one winning share pays $1.00 ( last two digits are decimals)

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select({
        status: marketsTable.status,
        expired: sql<boolean>`${marketsTable.closesAt} <= now()`,
      })
      .from(marketsTable)
      .where(eq(marketsTable.id, marketId))
      .for("update");

    if (!locked) {
      throw new AppError("market not found", 404);
    }
    if (!resolvableStatuses.includes(locked.status)) {
      throw new AppError("market cannot be resolved in current state", 400);
    }
    if (locked.status === "OPEN" && locked.expired) {
      await tx
        .update(marketsTable)
        .set({ status: "CLOSED", updatedAt: now })
        .where(eq(marketsTable.id, marketId));
    }

    const releaseCash = async (userId: string, amount: number) => {
      const [user] = await tx
        .select({ reservedBalance: usersTable.reservedBalance })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .for("update");
      if (!user) {
        throw new AppError("user not found", 404);
      }
      if (user.reservedBalance < amount) {
        throw new AppError("reservation mismatch", 500);
      }
      await tx
        .update(usersTable)
        .set({
          balance: sql`${usersTable.balance} + ${amount}`,
          reservedBalance: sql`${usersTable.reservedBalance} - ${amount}`,
          updatedAt: now,
        })
        .where(eq(usersTable.id, userId));
      await tx.insert(ledgerTable).values({
        type: "BID",
        userId,
        amount,
        entryDirection: "CREDIT",
      });
    };

    const releaseShares = async (userId: string, outcome: MarketOutcome, qty: number) => {
      const [position] = await tx
        .select()
        .from(positionsTable)
        .where(
          and(
            eq(positionsTable.userId, userId),
            eq(positionsTable.marketId, marketId),
            eq(positionsTable.outcome, outcome),
          ),
        )
        .for("update");
      if (!position || position.reservedQuantity < qty) {
        throw new AppError("reservation mismatch", 500);
      }
      await tx
        .update(positionsTable)
        .set({ reservedQuantity: sql`${positionsTable.reservedQuantity} - ${qty}` })
        .where(eq(positionsTable.id, position.id));
    };

    const marketPositions = await tx
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.marketId, marketId));

    const credits = new Map<string, number>();
    for (const position of marketPositions) {
      const amount = isRefund
        ? position.quantity * position.avgPrice
        : position.outcome === outcome
          ? position.quantity * PAYOUT_PER_SHARE
          : 0;
      if (amount > 0) {
        credits.set(position.userId, (credits.get(position.userId) ?? 0) + amount);
      }
    }
    for (const [userId, amount] of credits) {
      await tx
        .update(usersTable)
        .set({
          balance: sql`${usersTable.balance} + ${amount}`,
          updatedAt: now,
        })
        .where(eq(usersTable.id, userId));
      await tx.insert(ledgerTable).values({
        type: isRefund ? "REFUND" : "PAYOUT",
        userId,
        amount,
        entryDirection: "CREDIT",
      });
    }

    const cancelledOrders = await tx
      .update(ordersTable)
      .set({ status: "CANCELLED", updatedAt: now })
      .where(
        and(
          eq(ordersTable.marketId, marketId),
          inArray(ordersTable.status, cancellableOrderStatuses),
        ),
      )
      .returning({
        id: ordersTable.id,
        userId: ordersTable.userId,
        side: ordersTable.side,
        outcome: ordersTable.outcome,
        price: ordersTable.price,
        quantity: ordersTable.quantity,
        filledQuantity: ordersTable.filledQuantity,
      });
    for (const order of cancelledOrders) {
      const remainder = order.quantity - order.filledQuantity;
      if (remainder <= 0) {
        continue;
      }
      if (order.side === "BID") {
        await releaseCash(order.userId, order.price * remainder);
      } else {
        await releaseShares(order.userId, order.outcome, remainder);
      }
    }

    await tx
      .update(positionsTable)
      .set({ settledAt: now, reservedQuantity: 0 })
      .where(eq(positionsTable.marketId, marketId));

    const [updated] = await tx
      .update(marketsTable)
      .set({
        status,
        outcome,
        resolvedBy: adminId,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(and(eq(marketsTable.id, marketId), inArray(marketsTable.status, resolvableStatuses)))
      .returning();
    if (!updated) {
      throw new AppError("market cannot be resolved in current state", 400);
    }
    return updated;
  });
};

export const deleteMarket = async (marketId: string) => {
  const market = await getMarketById(marketId);
  if (market.status !== "DRAFT") {
    throw new AppError("only draft markets can be deleted", 400);
  }
  const [existingOrder] = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(eq(ordersTable.marketId, marketId))
    .limit(1);
  if (existingOrder) {
    throw new AppError("only empty draft markets can be deleted", 400);
  }
  await db.delete(marketsTable).where(eq(marketsTable.id, marketId));
};
