import { cn } from "@fluke/ui/lib/utils";
import type * as React from "react";

import { marketStatusLabel, orderStatusLabel } from "@/lib/format";
import type { MarketStatus, OrderStatus } from "@/lib/types";

export const primaryAction =
  "inline-flex h-10 items-center justify-center gap-2 border-2 border-foreground bg-foreground px-4 font-mono text-[11px] tracking-[0.16em] text-background uppercase transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export const secondaryAction =
  "inline-flex h-10 items-center justify-center gap-2 border border-foreground px-4 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-40";

export const textAction =
  "font-mono text-[11px] tracking-[0.16em] uppercase underline underline-offset-4 hover:text-signal";

export const inputClass =
  "h-10 w-full border border-border bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-signal focus-visible:ring-1 focus-visible:ring-signal/40 disabled:cursor-not-allowed disabled:opacity-50";

export const labelClass = "font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>{label}</span>
        {hint ? <span className="font-mono text-[10px] text-muted-foreground">{hint}</span> : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] uppercase">
      <span className="bg-signal px-1.5 py-0.5 text-background">{n}</span>
      <span className="text-muted-foreground">{children}</span>
    </p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b-2 border-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-12 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-signal uppercase">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.02] tracking-[-0.01em] text-balance sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

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

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-2 border-dashed border-border px-6 py-14 text-center">
      <p className="font-serif text-2xl">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse border border-border bg-muted/40" />
      ))}
    </div>
  );
}
