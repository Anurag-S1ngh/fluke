import { db } from "@/services";
import { AppError } from "@/types/error";
import { marketsTable, ordersTable } from "@fluke/db/schema/index";
import { desc, eq } from "drizzle-orm";

type MarketStatus = typeof marketsTable.$inferSelect.status;

export const listMarkets = async (status: MarketStatus = "OPEN") => {
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
  input: { outcome?: "YES" | "NO"; refund?: boolean },
  adminId: string,
) => {
  const market = await getMarketById(marketId);
  if (!(market.status === "OPEN" || market.status === "CLOSED")) {
    throw new AppError("market cannot be resolved in current state", 400);
  }
  const [updated] = await db
    .update(marketsTable)
    .set({
      status: input.refund ? "REFUND" : "RESOLVED",
      outcome: input.refund ? null : (input.outcome ?? null),
      resolvedBy: adminId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(marketsTable.id, marketId))
    .returning();
  if (!updated) {
    throw new AppError("market not found", 404);
  }
  return updated;
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
