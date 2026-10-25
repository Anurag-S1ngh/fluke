"use client";

import { api } from "@/lib/api";
import type {
  BookLevel,
  HistoryRange,
  Market,
  MarketHistory,
  MarketStatus,
  MarketSummary,
  Order,
  Position,
} from "@/lib/types";
import { createResource } from "./resource";

export const useMarkets = createResource((status: MarketStatus) =>
  api<{ markets: MarketSummary[] }>(`/markets?status=${status}`),
);

export const useMarket = createResource((marketId: string) =>
  api<{ market: Market }>(`/markets/${marketId}`),
);

export const useBook = createResource((marketId: string) =>
  api<{ book: BookLevel[] }>(`/orders/book?marketId=${marketId}`),
);

export const useHistory = createResource(
  ({ marketId, range }: { marketId: string; range: HistoryRange }) =>
    api<MarketHistory>(`/markets/${marketId}/history?range=${range}`),
  (a, b) => a.marketId === b.marketId && a.range === b.range,
);

export const useOrders = createResource(
  ({ userId, marketId }: { userId: string | null; marketId?: string }) =>
    userId
      ? api<{ orders: Order[] }>(marketId ? `/orders?marketId=${marketId}` : "/orders")
      : Promise.resolve({ orders: [] }),
  (a, b) => a.userId === b.userId && a.marketId === b.marketId,
);

export const usePositions = createResource((userId: string | null) =>
  userId ? api<{ positions: Position[] }>("/positions") : Promise.resolve({ positions: [] }),
);
