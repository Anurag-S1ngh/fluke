import { getMarketById } from "@/modules/market/market.service";
import { db } from "@/services";
import { AppError } from "@/types/error";
import { ledgerTable, ordersTable, positionsTable, usersTable } from "@fluke/db/schema/index";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { PlaceOrderInput } from "./order.types";

export const placeOrder = async (userId: string, input: PlaceOrderInput) => {
  const market = await getMarketById(input.marketId);
  if (market.status !== "OPEN") {
    throw new AppError("market is not open for trading", 400);
  }
  if (market.closesAt.getTime() <= Date.now()) {
    throw new AppError("market is closed for trading", 400);
  }
  return db.transaction(async (tx) => {
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
    return order;
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
    return updated;
  });
};

export const listMyOrders = async (userId: string, marketId?: string) => {
  const conditions = marketId
    ? and(eq(ordersTable.userId, userId), eq(ordersTable.marketId, marketId))
    : eq(ordersTable.userId, userId);
  return db.select().from(ordersTable).where(conditions).orderBy(desc(ordersTable.createdAt));
};
