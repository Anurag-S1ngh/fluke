import { getMarketById } from "@/modules/market/market.service";
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
import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import type { OrderRow, OrderTx, PlaceOrderInput } from "./order.types";

const findFillableOrders = async (tx: OrderTx, taker: OrderRow) => {
  const oppositeSide = taker.side === "BID" ? "ASK" : "BID";
  return tx
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.marketId, taker.marketId),
        eq(ordersTable.outcome, taker.outcome),
        eq(ordersTable.side, oppositeSide),
        inArray(ordersTable.status, ["OPEN", "PARTIALLY_FILLED"]),
        ne(ordersTable.userId, taker.userId),
        taker.side === "BID"
          ? lte(ordersTable.price, taker.price)
          : gte(ordersTable.price, taker.price),
      ),
    )
    .orderBy(
      taker.side === "BID" ? asc(ordersTable.price) : desc(ordersTable.price),
      asc(ordersTable.createdAt),
    )
    .for("update");
};

const applyFill = async (
  tx: OrderTx,
  fill: { bid: OrderRow; ask: OrderRow; qty: number; execPrice: number },
) => {
  const { bid, ask, qty, execPrice } = fill;
  await tx.insert(tradesTable).values({
    askOrderId: ask.id,
    bidOrderId: bid.id,
    marketId: bid.marketId,
    outcome: bid.outcome,
    quantity: qty,
    price: execPrice,
  });

  const lockAmount = bid.price * qty;
  const surplus = (bid.price - execPrice) * qty;
  const [buyer] = await tx
    .update(usersTable)
    .set({
      balance: sql`${usersTable.balance} + ${surplus}`,
      reservedBalance: sql`${usersTable.reservedBalance} - ${lockAmount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(usersTable.id, bid.userId), gte(usersTable.reservedBalance, lockAmount)))
    .returning({ id: usersTable.id });
  if (!buyer) {
    throw new AppError("reservation mismatch", 500);
  }

  await tx
    .insert(positionsTable)
    .values({
      userId: bid.userId,
      marketId: bid.marketId,
      outcome: bid.outcome,
      quantity: qty,
      avgPrice: execPrice,
    })
    .onConflictDoUpdate({
      target: [positionsTable.userId, positionsTable.marketId, positionsTable.outcome],
      set: {
        quantity: sql`${positionsTable.quantity} + ${qty}`,
        avgPrice: sql`CAST(ROUND((${positionsTable.quantity} * ${positionsTable.avgPrice} + ${qty}::numeric * ${execPrice}::numeric) / (${positionsTable.quantity} + ${qty}::numeric), 0) AS integer)`,
      },
    });

  const [sellerPosition] = await tx
    .update(positionsTable)
    .set({
      quantity: sql`${positionsTable.quantity} - ${qty}`,
      reservedQuantity: sql`${positionsTable.reservedQuantity} - ${qty}`,
    })
    .where(
      and(
        eq(positionsTable.userId, ask.userId),
        eq(positionsTable.marketId, ask.marketId),
        eq(positionsTable.outcome, ask.outcome),
        gte(positionsTable.quantity, qty),
        gte(positionsTable.reservedQuantity, qty),
      ),
    )
    .returning({ id: positionsTable.id });
  if (!sellerPosition) {
    throw new AppError("reservation mismatch", 500);
  }

  const saleAmount = execPrice * qty;
  await tx
    .update(usersTable)
    .set({
      balance: sql`${usersTable.balance} + ${saleAmount}`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, ask.userId));

  const entries: (typeof ledgerTable.$inferInsert)[] = [];
  if (surplus > 0) {
    entries.push({
      type: "BID",
      userId: bid.userId,
      amount: surplus,
      entryDirection: "CREDIT",
    });
  }
  entries.push({
    type: "ASK",
    userId: ask.userId,
    amount: saleAmount,
    entryDirection: "CREDIT",
  });
  await tx.insert(ledgerTable).values(entries);

  const updated = await tx
    .update(ordersTable)
    .set({
      filledQuantity: sql`${ordersTable.filledQuantity} + ${qty}`,
      status: sql`(CASE WHEN ${ordersTable.filledQuantity} + ${qty} >= ${ordersTable.quantity} THEN 'FILLED' ELSE 'PARTIALLY_FILLED' END)::order_status`,
      updatedAt: new Date(),
    })
    .where(inArray(ordersTable.id, [bid.id, ask.id]))
    .returning({ id: ordersTable.id });
  if (updated.length !== 2) {
    throw new AppError("order not found", 404);
  }
};

export const placeOrder = async (userId: string, input: PlaceOrderInput) => {
  const market = await getMarketById(input.marketId);
  if (market.status !== "OPEN") {
    throw new AppError("market is not open for trading", 400);
  }
  if (market.closesAt.getTime() <= Date.now()) {
    throw new AppError("market is closed for trading", 400);
  }
  return db.transaction(async (tx) => {
    const [marketState] = await tx
      .select({
        status: marketsTable.status,
        expired: sql<boolean>`${marketsTable.closesAt} <= now()`,
      })
      .from(marketsTable)
      .where(eq(marketsTable.id, input.marketId))
      .for("share");

    if (!marketState || marketState.status !== "OPEN" || marketState.expired) {
      throw new AppError("market is not open for trading", 400);
    }

    if (input.side === "BID") {
      const cost = input.price * input.quantity;
      const [user] = await tx
        .select({ balance: usersTable.balance })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .for("update");
      if (!user) {
        throw new AppError("user not found", 404);
      }
      if (user.balance < cost) {
        throw new AppError("insufficient balance", 400);
      }
      await tx
        .update(usersTable)
        .set({
          balance: sql`${usersTable.balance} - ${cost}`,
          reservedBalance: sql`${usersTable.reservedBalance} + ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));
      await tx.insert(ledgerTable).values({
        type: "BID",
        userId,
        amount: cost,
        entryDirection: "DEBIT",
      });
    } else {
      const [position] = await tx
        .select()
        .from(positionsTable)
        .where(
          and(
            eq(positionsTable.userId, userId),
            eq(positionsTable.marketId, input.marketId),
            eq(positionsTable.outcome, input.outcome),
          ),
        )
        .for("update");
      if (!position || position.quantity - position.reservedQuantity < input.quantity) {
        throw new AppError("insufficient shares", 400);
      }
      await tx
        .update(positionsTable)
        .set({
          reservedQuantity: sql`${positionsTable.reservedQuantity} + ${input.quantity}`,
        })
        .where(eq(positionsTable.id, position.id));
    }
    const [order] = await tx
      .insert(ordersTable)
      .values({
        userId,
        marketId: input.marketId,
        side: input.side,
        outcome: input.outcome,
        price: input.price,
        quantity: input.quantity,
      })
      .returning();
    if (!order) {
      throw new AppError("failed to place order", 500);
    }
    let remaining = order.quantity;
    const fillableOrders = await findFillableOrders(tx, order);
    for (const bookOrder of fillableOrders) {
      if (remaining <= 0) {
        break;
      }
      const fill = Math.min(remaining, bookOrder.quantity - bookOrder.filledQuantity);
      if (fill <= 0) {
        continue;
      }
      const bid = order.side === "BID" ? order : bookOrder;
      const ask = order.side === "BID" ? bookOrder : order;
      await applyFill(tx, { bid, ask, qty: fill, execPrice: bookOrder.price });
      remaining -= fill;
    }
    const filledQuantity = order.quantity - remaining;
    const [account] = await tx
      .select({ balance: usersTable.balance })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return {
      order: {
        ...order,
        filledQuantity,
        status:
          filledQuantity >= order.quantity
            ? ("FILLED" as const)
            : filledQuantity > 0
              ? ("PARTIALLY_FILLED" as const)
              : ("OPEN" as const),
      },
      balance: account?.balance ?? 0,
    };
  });
};

export const cancelOrder = async (userId: string, orderId: string) => {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.userId, userId)))
    .limit(1);
  if (!order) {
    throw new AppError("order not found", 404);
  }
  if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") {
    throw new AppError("only open orders can be cancelled", 400);
  }
  const remainder = order.quantity - order.filledQuantity;
  if (remainder < 0) {
    throw new AppError("reservation mismatch", 500);
  }
  return db.transaction(async (tx) => {
    if (order.side === "BID") {
      const amount = order.price * remainder;
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
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId));
      await tx.insert(ledgerTable).values({
        type: "BID",
        userId,
        amount,
        entryDirection: "CREDIT",
      });
    } else {
      const [position] = await tx
        .select()
        .from(positionsTable)
        .where(
          and(
            eq(positionsTable.userId, userId),
            eq(positionsTable.marketId, order.marketId),
            eq(positionsTable.outcome, order.outcome),
          ),
        )
        .for("update");
      if (!position || position.reservedQuantity < remainder) {
        throw new AppError("reservation mismatch", 500);
      }
      await tx
        .update(positionsTable)
        .set({
          reservedQuantity: sql`${positionsTable.reservedQuantity} - ${remainder}`,
        })
        .where(eq(positionsTable.id, position.id));
    }
    const [updated] = await tx
      .update(ordersTable)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(
        and(eq(ordersTable.id, orderId), inArray(ordersTable.status, ["OPEN", "PARTIALLY_FILLED"])),
      )
      .returning();
    if (!updated) {
      throw new AppError("only open orders can be cancelled", 400);
    }
    const [account] = await tx
      .select({ balance: usersTable.balance })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    return { order: updated, balance: account?.balance ?? 0 };
  });
};

export const listMyOrders = async (userId: string, marketId?: string) => {
  const conditions = marketId
    ? and(eq(ordersTable.userId, userId), eq(ordersTable.marketId, marketId))
    : eq(ordersTable.userId, userId);
  return db
    .select({
      id: ordersTable.id,
      userId: ordersTable.userId,
      marketId: ordersTable.marketId,
      question: marketsTable.question,
      side: ordersTable.side,
      outcome: ordersTable.outcome,
      price: ordersTable.price,
      quantity: ordersTable.quantity,
      filledQuantity: ordersTable.filledQuantity,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .innerJoin(marketsTable, eq(ordersTable.marketId, marketsTable.id))
    .where(conditions)
    .orderBy(desc(ordersTable.createdAt));
};

export const getOrderBook = async (marketId: string, depth = 20) => {
  const levels = await db
    .select({
      side: ordersTable.side,
      outcome: ordersTable.outcome,
      price: ordersTable.price,
      quantity: sql<number>`sum(${ordersTable.quantity} - ${ordersTable.filledQuantity})`.mapWith(
        Number,
      ),
    })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.marketId, marketId),
        inArray(ordersTable.status, ["OPEN", "PARTIALLY_FILLED"]),
      ),
    )
    .groupBy(ordersTable.side, ordersTable.outcome, ordersTable.price)
    .orderBy(desc(ordersTable.price));

  const groups = new Map<string, typeof levels>();
  for (const level of levels) {
    const key = `${level.outcome}:${level.side}`;
    const group = groups.get(key);
    if (group) {
      group.push(level);
    } else {
      groups.set(key, [level]);
    }
  }

  return [...groups.values()].flatMap((group) => {
    const sorted = [...group].sort((a, b) => b.price - a.price);
    return group[0]?.side === "ASK" ? sorted.slice(-depth).reverse() : sorted.slice(0, depth);
  });
};
