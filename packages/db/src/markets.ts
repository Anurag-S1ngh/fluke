import { and, eq, sql } from "drizzle-orm";
import type { Database } from "./index";
import { marketsTable } from "./schema/index";

export const expireMarkets = async (db: Database) => {
  const closed = await db
    .update(marketsTable)
    .set({ status: "CLOSED", updatedAt: new Date() })
    .where(and(eq(marketsTable.status, "OPEN"), sql`${marketsTable.closesAt} <= now()`))
    .returning({ id: marketsTable.id });
  return closed.length;
};

export const expireMarket = async (db: Database, marketId: string) => {
  const [closed] = await db
    .update(marketsTable)
    .set({ status: "CLOSED", updatedAt: new Date() })
    .where(
      and(
        eq(marketsTable.id, marketId),
        eq(marketsTable.status, "OPEN"),
        sql`${marketsTable.closesAt} <= now()`,
      ),
    )
    .returning();
  return closed ?? null;
};
