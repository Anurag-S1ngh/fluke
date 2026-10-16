import { pgEnum } from "drizzle-orm/pg-core";

export const outcomeEnum = pgEnum("outcome", ["YES", "NO"]);

export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);

export const marketStatusEnum = pgEnum("market_status", [
  "OPEN",
  "CLOSED",
  "DRAFT",
  "RESOLVED",
  "REFUND",
]);

export const sideEnum = pgEnum("side", ["ASK", "BID"]);

export const ledgerTypeEnum = pgEnum("ledger_type", ["ASK", "BID", "REFUND", "PAYOUT"]);
export const entryDirectionEnum = pgEnum("entry_direction", ["DEBIT", "CREDIT"]);

export const orderStatusEnum = pgEnum("order_status", [
  "OPEN",
  "FILLED",
  "CANCELLED",
  "PARTIALLY_FILLED",
]);
