import { db } from "@/services";
import { marketsTable, positionsTable } from "@fluke/db/schema/index";
import { desc, eq } from "drizzle-orm";

export const listPositions = async (userId: string) => {
  return db
    .select({
      id: positionsTable.id,
      marketId: positionsTable.marketId,
      question: marketsTable.question,
      status: marketsTable.status,
      marketOutcome: marketsTable.outcome,
      closesAt: marketsTable.closesAt,
      outcome: positionsTable.outcome,
      quantity: positionsTable.quantity,
      reservedQuantity: positionsTable.reservedQuantity,
      avgPrice: positionsTable.avgPrice,
      settledAt: positionsTable.settledAt,
      createdAt: positionsTable.createdAt,
    })
    .from(positionsTable)
    .innerJoin(marketsTable, eq(positionsTable.marketId, marketsTable.id))
    .where(eq(positionsTable.userId, userId))
    .orderBy(desc(positionsTable.settledAt), desc(positionsTable.createdAt));
};
