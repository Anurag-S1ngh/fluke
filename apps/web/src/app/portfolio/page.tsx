"use client";

import { cn } from "@fluke/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { OrdersTable } from "@/components/orders-table";
import {
  EmptyState,
  PageHeader,
  primaryAction,
  secondaryAction,
  SkeletonRows,
  StatusTag,
  textAction,
} from "@/components/ui-bits";
import { api } from "@/lib/api";
import { formatDate, formatMoney, formatPrice } from "@/lib/format";
import type { Order, Position } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

export default function PortfolioPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [tab, setTab] = React.useState<"live" | "settled">("live");
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const positions = useAsync(`positions:${user?.id ?? "guest"}`, () =>
    user ? api<{ positions: Position[] }>("/positions") : Promise.resolve({ positions: [] }),
  );

  const orders = useAsync(`orders:${user?.id ?? "guest"}`, () =>
    user ? api<{ orders: Order[] }>("/orders") : Promise.resolve({ orders: [] }),
  );

  const allPositions = positions.data?.positions ?? [];
  const live = allPositions.filter((position) => !position.settledAt && position.quantity > 0);
  const settled = allPositions.filter((position) => position.settledAt && position.quantity > 0);
  const costBasis = live.reduce(
    (total, position) => total + position.quantity * position.avgPrice,
    0,
  );

  const cancelOrder = async (order: Order) => {
    setCancellingId(order.id);
    try {
      await api(`/orders/${order.id}`, { method: "DELETE" });
      toast.success("Order cancelled.");
      await Promise.all([orders.reload(), positions.reload(), refresh()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel the order.");
    } finally {
      setCancellingId(null);
    }
  };

  const rows = tab === "live" ? live : settled;

  return (
    <main className="h-full overflow-y-auto">
      <PageHeader
        eyebrow="Portfolio"
        title={user ? `Hello, ${user.username}.` : "Your book."}
        description="Cash, positions, and the orders still waiting on the book."
        actions={
          <Link href="/markets" className={secondaryAction}>
            Browse markets
          </Link>
        }
      />

      {authLoading ? (
        <div className="mx-auto max-w-7xl px-6 py-10">
          <SkeletonRows rows={3} />
        </div>
      ) : !user ? (
        <div className="mx-auto max-w-7xl px-6 py-12">
          <EmptyState
            title="Sign in to open your book."
            description="Positions, resting orders, and cash live behind your account."
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/signin?next=${encodeURIComponent("/portfolio")}`}
                className={primaryAction}
              >
                Sign in
              </Link>
              <Link href="/signup" className={secondaryAction}>
                Join
              </Link>
            </div>
          </EmptyState>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
          <dl className="grid grid-cols-2 gap-px border-2 border-foreground bg-border sm:grid-cols-4">
            {[
              { label: "Cash available", value: formatMoney(user.balance) },
              { label: "Locked in orders", value: formatMoney(user.reservedBalance) },
              { label: "Open positions", value: String(live.length) },
              { label: "At cost", value: formatMoney(costBasis) },
            ].map((item) => (
              <div key={item.label} className="bg-background p-4">
                <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  {item.label}
                </dt>
                <dd className="mt-2 font-mono text-xl">{item.value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "live", label: `Live (${live.length})` },
                    { id: "settled", label: `Settled (${settled.length})` },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTab(option.id)}
                    aria-pressed={tab === option.id}
                    className={cn(
                      "border-2 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                      tab === option.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {positions.error ? (
                <button
                  type="button"
                  onClick={() => void positions.reload()}
                  className={textAction}
                >
                  Retry positions
                </button>
              ) : null}
            </div>

            {positions.loading ? (
              <SkeletonRows rows={3} />
            ) : positions.error ? (
              <EmptyState title="Could not read your positions." description={positions.error} />
            ) : rows.length === 0 ? (
              <EmptyState
                title={tab === "live" ? "No open positions." : "Nothing settled yet."}
                description={
                  tab === "live"
                    ? "Buy a side on an open question and it will appear here."
                    : "Resolved and refunded positions are filed here."
                }
              >
                {tab === "live" ? (
                  <Link href="/markets" className={secondaryAction}>
                    Find a question
                  </Link>
                ) : null}
              </EmptyState>
            ) : (
              <>
                <div className="space-y-2 sm:hidden">
                  {rows.map((position) => {
                    const result =
                      position.status === "REFUND"
                        ? "Refunded"
                        : position.marketOutcome === position.outcome
                          ? "Won"
                          : "Lost";
                    return (
                      <article key={position.id} className="border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/markets/${position.marketId}` as Route}
                            className="line-clamp-2 font-serif text-lg leading-tight underline-offset-4 hover:text-signal hover:underline"
                          >
                            {position.question}
                          </Link>
                          <StatusTag status={position.status} />
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
                          <div>
                            <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                              Side
                            </dt>
                            <dd className="mt-0.5 font-mono text-[11px]">
                              {position.outcome} · {position.quantity} shares
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                              Avg price
                            </dt>
                            <dd className="mt-0.5 font-mono text-[11px]">
                              {formatPrice(position.avgPrice)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                              {tab === "live" ? "At cost" : "Result"}
                            </dt>
                            <dd className="mt-0.5 font-mono text-[11px]">
                              {tab === "live" ? (
                                formatMoney(position.quantity * position.avgPrice)
                              ) : (
                                <span
                                  className={
                                    result === "Won"
                                      ? "text-signal"
                                      : result === "Lost"
                                        ? "text-muted-foreground"
                                        : ""
                                  }
                                >
                                  {result}
                                </span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                              {tab === "live" ? "Payout if right" : "Settled"}
                            </dt>
                            <dd className="mt-0.5 font-mono text-[11px]">
                              {tab === "live"
                                ? formatMoney(position.quantity * 100)
                                : position.settledAt
                                  ? formatDate(position.settledAt)
                                  : "—"}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto border border-border sm:block">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b-2 border-foreground">
                        {[
                          "Market",
                          "Side",
                          "Shares",
                          "Avg price",
                          tab === "live" ? "At cost" : "Result",
                          tab === "live" ? "Payout if right" : "Settled",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-3 py-2 font-mono text-[9px] font-normal tracking-[0.16em] text-muted-foreground uppercase"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((position) => {
                        const result =
                          position.status === "REFUND"
                            ? "Refunded"
                            : position.marketOutcome === position.outcome
                              ? "Won"
                              : "Lost";
                        return (
                          <tr key={position.id} className="border-b border-border last:border-b-0">
                            <td className="max-w-[22rem] px-3 py-3">
                              <Link
                                href={`/markets/${position.marketId}` as Route}
                                className="line-clamp-1 text-sm underline-offset-4 hover:text-signal hover:underline"
                              >
                                {position.question}
                              </Link>
                              <div className="mt-1.5">
                                <StatusTag status={position.status} />
                              </div>
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                              {position.outcome}
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                              {position.quantity}
                              {position.reservedQuantity > 0 && !position.settledAt ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({position.reservedQuantity} held)
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                              {formatPrice(position.avgPrice)}
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                              {tab === "live" ? (
                                formatMoney(position.quantity * position.avgPrice)
                              ) : (
                                <span
                                  className={
                                    result === "Won"
                                      ? "text-signal"
                                      : result === "Lost"
                                        ? "text-muted-foreground"
                                        : ""
                                  }
                                >
                                  {result}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                              {tab === "live"
                                ? formatMoney(position.quantity * 100)
                                : position.settledAt
                                  ? formatDate(position.settledAt)
                                  : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-mono text-[10px] tracking-[0.18em] uppercase">Orders</h2>
              {orders.error ? (
                <button type="button" onClick={() => void orders.reload()} className={textAction}>
                  Retry orders
                </button>
              ) : null}
            </div>
            <OrdersTable
              orders={orders.data?.orders ?? []}
              loading={orders.loading}
              showMarket
              cancellingId={cancellingId}
              onCancel={(order) => void cancelOrder(order)}
              emptyTitle="No resting orders."
              emptyDescription="Filled and cancelled orders are kept here too."
            />
          </section>
        </div>
      )}
    </main>
  );
}
