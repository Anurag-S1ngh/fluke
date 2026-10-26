export type Outcome = "YES" | "NO";
export type Side = "BID" | "ASK";
export type MarketStatus = "DRAFT" | "OPEN" | "CLOSED" | "RESOLVED" | "REFUND";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";
export interface Me {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: "ADMIN" | "USER";
}

export interface MarketSummary {
  id: string;
  question: string;
  status: MarketStatus;
  outcome: Outcome | null;
  closesAt: string;
  createdAt: string;
  /** Last traded YES price in cents, or null when the book has no trades. */
  lastPrice: number | null;
}

export interface Market extends MarketSummary {
  description: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  marketId: string;
  question?: string;
  side: Side;
  outcome: Outcome;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  marketId: string;
  question: string;
  status: MarketStatus;
  marketOutcome: Outcome | null;
  closesAt: string;
  outcome: Outcome;
  quantity: number;
  reservedQuantity: number;
  avgPrice: number;
  settledAt: string | null;
  createdAt: string;
}

export interface BookLevel {
  side: Side;
  outcome: Outcome;
  price: number;
  quantity: number;
}

export interface MarketHistoryPoint {
  t: string;
  yes: number;
}

export type HistoryRange = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

export interface MarketHistory {
  points: MarketHistoryPoint[];
  volume: number;
  trades: number;
}

export interface CreateMarketInput {
  question: string;
  description: string;
  closesAt: string;
  publish?: boolean;
}
