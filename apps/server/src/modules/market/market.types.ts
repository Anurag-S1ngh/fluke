import type { outcomeEnum } from "@fluke/db/schema/enums";
import type { marketsTable } from "@fluke/db/schema/index";

export type MarketStatus = typeof marketsTable.$inferSelect.status;

export type MarketOutcome = (typeof outcomeEnum.enumValues)[number];

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
