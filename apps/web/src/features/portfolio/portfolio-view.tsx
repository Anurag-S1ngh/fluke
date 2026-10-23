"use client";

import { cn } from "@fluke/ui/lib/utils";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/layout/auth-provider";
import { SiteFooter } from "@/components/layout/footer";
import { OrdersTable } from "@/components/market/orders-table";
import { primaryAction, secondaryAction, textAction } from "@/components/ui/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { api } from "@/lib/api";
import type { Order, Position } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

import { PortfolioSummary } from "./portfolio-summary";
import { PositionsTable, type PositionTab } from "./positions-table";

export function PortfolioView() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [tab, setTab] = React.useState<PositionTab>("live");
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
          <PortfolioSummary
            balance={user.balance}
            openPositions={live.length}
            costBasis={costBasis}
          />

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

            <PositionsTable
              rows={rows}
              tab={tab}
              loading={positions.loading}
              error={positions.error}
              onRetry={() => void positions.reload()}
            />
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

      <SiteFooter />
    </main>
  );
}
