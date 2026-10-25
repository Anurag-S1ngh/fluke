import type { Database } from "@fluke/db";
import { expireMarkets } from "@fluke/db/markets";

export const createCloseExpiredMarketsProcessor = (database: Database) => async () => {
  const closed = await expireMarkets(database);
  if (closed > 0) {
    console.log(`[worker] closed ${closed} expired market(s)`);
  }
  return { closed };
};
