import type { Route } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusTag } from "@/components/ui/status-tag";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export function OrdersTable({
  orders,
  loading,
  showMarket = false,
  cancellingId,
  onCancel,
  emptyTitle = "No orders.",
  emptyDescription = "Orders you place will be listed here.",
}: {
  orders: Order[];
  loading?: boolean;
  showMarket?: boolean;
  cancellingId?: string | null;
  onCancel?: (order: Order) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-12 animate-pulse border border-border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const cancellable = (order: Order) =>
    order.status === "OPEN" || order.status === "PARTIALLY_FILLED";

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {orders.map((order) => (
          <article key={order.id} className="border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {showMarket ? (
                  <Link
                    href={`/markets/${order.marketId}` as Route}
                    className="line-clamp-2 font-serif text-lg leading-tight underline-offset-4 hover:text-signal hover:underline"
                  >
                    {order.question ?? "Market"}
                  </Link>
                ) : null}
                <p className="mt-1 font-mono text-[11px]">
                  {order.side === "BID" ? "Buy" : "Sell"} {order.outcome} at{" "}
                  {formatPrice(order.price)}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                  {formatDate(order.createdAt)} · filled {order.filledQuantity}/{order.quantity}
                </p>
              </div>
              <OrderStatusTag status={order.status} />
            </div>
            {onCancel && cancellable(order) ? (
              <button
                type="button"
                onClick={() => onCancel(order)}
                disabled={cancellingId === order.id}
                className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive disabled:opacity-40"
              >
                {cancellingId === order.id ? "Cancelling" : "Cancel order"}
              </button>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto border border-border sm:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-foreground">
              {[
                "Placed",
                ...(showMarket ? ["Market"] : []),
                "Order",
                "Price",
                "Filled",
                "Status",
                "",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-3 py-2 font-mono text-[9px] font-normal tracking-[0.16em] text-muted-foreground"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                  {formatDate(order.createdAt)}
                </td>
                {showMarket ? (
                  <td className="max-w-[22rem] px-3 py-3 text-sm">
                    <Link
                      href={`/markets/${order.marketId}` as Route}
                      className="line-clamp-1 underline-offset-4 hover:text-signal hover:underline"
                    >
                      {order.question ?? "Market"}
                    </Link>
                  </td>
                ) : null}
                <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                  {order.side === "BID" ? "Buy" : "Sell"} {order.outcome}
                </td>
                <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                  {formatPrice(order.price)}
                </td>
                <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                  {order.filledQuantity} / {order.quantity}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <OrderStatusTag status={order.status} />
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  {onCancel && cancellable(order) ? (
                    <button
                      type="button"
                      onClick={() => onCancel(order)}
                      disabled={cancellingId === order.id}
                      className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive disabled:opacity-40"
                    >
                      {cancellingId === order.id ? "Cancelling" : "Cancel"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
