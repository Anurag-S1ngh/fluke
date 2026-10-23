import { cn } from "@fluke/ui/lib/utils";

import { marketStatusLabel, orderStatusLabel } from "@/lib/format";
import type { MarketStatus, OrderStatus } from "@/lib/types";

const marketStatusStyles: Record<MarketStatus, string> = {
  OPEN: "border-signal text-signal",
  CLOSED: "border-foreground/40 text-muted-foreground",
  DRAFT: "border-border text-muted-foreground",
  RESOLVED: "border-foreground bg-foreground text-background",
  REFUND: "border-destructive text-destructive",
};

export function StatusTag({ status, className }: { status: MarketStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
        marketStatusStyles[status],
        className,
      )}
    >
      {marketStatusLabel[status]}
    </span>
  );
}

const orderStatusStyles: Record<OrderStatus, string> = {
  OPEN: "border-signal text-signal",
  PARTIALLY_FILLED: "border-signal text-signal",
  FILLED: "border-foreground bg-foreground text-background",
  CANCELLED: "border-border text-muted-foreground",
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
        orderStatusStyles[status],
      )}
    >
      {orderStatusLabel[status]}
    </span>
  );
}
