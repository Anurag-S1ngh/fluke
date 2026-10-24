import { marketsTable } from "@fluke/db/schema/index";
import { and, eq, lte, sql } from "drizzle-orm";

import { db } from "../services";

export type CloseExpiredMarketsResult = {
  closed: number;
  ids: string[];
};

/**
 * Closes every OPEN market whose close time has passed. The database clock is
 * used on both sides so worker hosts with skewed clocks cannot close early.
 */
export const closeExpiredMarkets = async (): Promise<CloseExpiredMarketsResult> => {
  const closed = await db
    .update(marketsTable)
    .set({ status: "CLOSED", updatedAt: sql`now()` })
    .where(and(eq(marketsTable.status, "OPEN"), lte(marketsTable.closesAt, sql`now()`)))
    .returning({ id: marketsTable.id });

  return { closed: closed.length, ids: closed.map((market) => market.id) };
};
