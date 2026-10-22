"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { OrderBook } from "@/components/order-book";
import { OrderTicket, type BestPrices } from "@/components/order-ticket";
import { OrdersTable } from "@/components/orders-table";
import { EmptyState, SkeletonRows, StatusTag, textAction } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import type { BookLevel, Market, Order, Outcome, Position } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

function computeBest(book: BookLevel[]): BestPrices {
  const pick = (outcome: Outcome) => {
    const bids = book
      .filter((level) => level.outcome === outcome && level.side === "BID")
      .sort((a, b) => b.price - a.price);
    const asks = book
      .filter((level) => level.outcome === outcome && level.side === "ASK")
      .sort((a, b) => a.price - b.price);
    return { bid: bids[0]?.price ?? null, ask: asks[0]?.price ?? null };
  };

  return { YES: pick("YES"), NO: pick("NO") };
}

export function MarketView({ marketId }: { marketId: string }) {
  const { user, refresh: refreshMe } = useAuth();
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const market = useAsync(`market:${marketId}`, () =>
    api<{ market: Market }>(`/markets/${marketId}`),
  );

  const book = useAsync(`book:${marketId}`, () =>
    api<{ book: BookLevel[] }>(`/orders/book?marketId=${marketId}`),
  );

  const orders = useAsync(`orders:${user?.id ?? "guest"}:${marketId}`, () =>
    user
      ? api<{ orders: Order[] }>(`/orders?marketId=${marketId}`)
      : Promise.resolve({ orders: [] }),
  );

  const positions = useAsync(`positions:${user?.id ?? "guest"}`, () =>
    user ? api<{ positions: Position[] }>("/positions") : Promise.resolve({ positions: [] }),
  );

  const levels = React.useMemo(() => book.data?.book ?? [], [book.data]);
  const best = React.useMemo(() => computeBest(levels), [levels]);

  const shares = React.useMemo(() => {
    const totals: Record<Outcome, number> = { YES: 0, NO: 0 };
    for (const position of positions.data?.positions ?? []) {
      if (position.marketId === marketId && !position.settledAt) {
        totals[position.outcome] += Math.max(0, position.quantity - position.reservedQuantity);
      }
    }
    return totals;
  }, [marketId, positions.data]);

  const reloadTrading = React.useCallback(async () => {
    await Promise.all([book.reload(), orders.reload(), positions.reload(), refreshMe()]);
  }, [book.reload, orders.reload, positions.reload, refreshMe]);

  const cancelOrder = React.useCallback(
    async (order: Order) => {
      setCancellingId(order.id);
      try {
        await api(`/orders/${order.id}`, { method: "DELETE" });
        toast.success("Order cancelled.");
        await reloadTrading();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not cancel the order.");
      } finally {
        setCancellingId(null);
      }
    },
    [reloadTrading],
  );

  if (market.loading) {
    return (
      <main className="h-full overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <SkeletonRows rows={3} />
        </div>
      </main>
    );
  }

  if (market.error || !market.data) {
    return (
      <main className="h-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <EmptyState
            title="This market is not on file."
            description={market.error ?? "The question could not be found."}
          >
            <Link href="/markets" className={textAction}>
              Back to markets
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  const data = market.data.market;
  const myOrders = orders.data?.orders ?? [];

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link href="/markets" className={textAction}>
          ← All markets
        </Link>
      </div>

      <header className="border-b-2 border-foreground">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-3">
            <StatusTag status={data.status} />
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {data.status === "OPEN" || data.status === "CLOSED"
                ? `Closes ${formatDateTime(data.closesAt)}`
                : `Filed ${formatDate(data.createdAt)}`}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[1.02] tracking-[-0.015em] text-balance sm:text-5xl lg:text-6xl">
            {data.question}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {data.description}
          </p>

          {data.status === "RESOLVED" && data.outcome ? (
            <div className="mt-7 border-l-4 border-signal pl-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-signal uppercase">
                Resolved {data.outcome}
              </p>
              <p className="mt-1 font-serif text-2xl">Winning shares paid one dollar each.</p>
            </div>
          ) : data.status === "REFUND" ? (
            <div className="mt-7 border-l-4 border-signal pl-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-signal uppercase">
                Refunded
              </p>
              <p className="mt-1 font-serif text-2xl">Every position was returned in full.</p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <aside className="space-y-6 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <OrderTicket market={data} best={best} shares={shares} onTraded={reloadTrading} />
          <section className="border border-border p-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Settlement
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              A winning share pays $1.00. A losing share expires at zero. If the question is voided,
              every position is refunded at cost. The market closes {formatDateTime(data.closesAt)}.
            </p>
          </section>
        </aside>

        <div className="space-y-10 lg:order-1">
          <OrderBook book={levels} loading={book.loading} />

          {user ? (
            <section>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="font-mono text-[10px] tracking-[0.18em] uppercase">Your orders</h2>
                <Link href="/portfolio" className={textAction}>
                  Portfolio
                </Link>
              </div>
              <OrdersTable
                orders={myOrders}
                loading={orders.loading}
                cancellingId={cancellingId}
                onCancel={(order) => void cancelOrder(order)}
                emptyTitle="No orders on this question."
                emptyDescription="Your buys and sells will appear here until they fill or are cancelled."
              />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
