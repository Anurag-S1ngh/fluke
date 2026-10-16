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
