import type { outcomeEnum } from "@fluke/db/schema/enums";
import type { marketsTable } from "@fluke/db/schema/index";

export type MarketStatus = typeof marketsTable.$inferSelect.status;

export type MarketOutcome = (typeof outcomeEnum.enumValues)[number];

export const HISTORY_RANGES = ["1H", "6H", "1D", "1W", "1M", "ALL"] as const;

export type HistoryRange = (typeof HISTORY_RANGES)[number];

export interface ResolveMarketInput {
  outcome?: MarketOutcome;
  refund?: boolean;
}

export interface MarketSummary {
  id: string;
  question: string;
  status: "OPEN" | "CLOSED" | "DRAFT" | "RESOLVED" | "REFUND";
  outcome: "YES" | "NO" | null;
  closesAt: Date;
  createdAt: Date;
  /** Last traded YES price in cents, or null when the book has no trades. */
  lastPrice: number | null;
}

export interface MarketDetail {
  id: string;
  question: string;
  description: string;
  status: "OPEN" | "CLOSED" | "DRAFT" | "RESOLVED" | "REFUND";
  outcome: "YES" | "NO" | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  closesAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
