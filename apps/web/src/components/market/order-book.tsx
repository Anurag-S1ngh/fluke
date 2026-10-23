"use client";

import { cn } from "@fluke/ui/lib/utils";
import * as React from "react";

import { formatMoney, formatPrice } from "@/lib/format";
import type { BookLevel, Outcome } from "@/lib/types";

type Level = { price: number; quantity: number };

function levelsFor(book: BookLevel[], outcome: Outcome, side: "ASK" | "BID", limit: number) {
  return book
    .filter((level) => level.outcome === outcome && level.side === side)
    .sort((a, b) => (side === "BID" ? b.price - a.price : a.price - b.price))
    .slice(0, limit);
}

function BookRows({
  levels,
  side,
  empty,
}: {
  levels: Level[];
  side: "ASK" | "BID";
  empty: string;
}) {
  if (levels.length === 0) {
    return (
      <p className="px-4 py-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
        {empty}
      </p>
    );
  }

  const ordered = side === "ASK" ? [...levels].reverse() : levels;

  return (
    <div>
      {ordered.map((level) => (
        <div
          key={level.price}
          className="grid grid-cols-3 items-baseline gap-4 border-b border-border/60 px-4 py-2 last:border-b-0"
        >
          <span
            className={cn("font-mono text-sm", side === "ASK" ? "text-destructive" : "text-signal")}
          >
            {formatPrice(level.price)}
          </span>
          <span className="font-mono text-xs text-right text-muted-foreground">
            {level.quantity}
          </span>
          <span className="font-mono text-xs text-right text-muted-foreground">
            {formatMoney(level.price * level.quantity)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OrderBook({
  book,
  loading,
  lastPrice,
}: {
  book: BookLevel[];
  loading: boolean;
  lastPrice: number | null;
}) {
  const [outcome, setOutcome] = React.useState<Outcome>("YES");

  const asks = levelsFor(book, outcome, "ASK", 6);
  const bids = levelsFor(book, outcome, "BID", 6);
  const bestAsk = asks[0]?.price ?? null;
  const bestBid = bids[0]?.price ?? null;
  const spread = bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null;

  return (
    <section className="border-2 border-foreground">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-foreground px-4 py-3">
        <h2 className="font-mono text-[10px] tracking-[0.18em]">Order book</h2>
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          {loading ? "Reading" : "Resting orders"}
        </p>
      </header>

      <div className="flex items-center gap-1 border-b border-border px-4 py-2">
        {(["YES", "NO"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setOutcome(option)}
            aria-pressed={outcome === option}
            className={cn(
              "border-2 px-3 py-1 font-mono text-[10px] tracking-[0.14em] transition-colors",
              outcome === option
                ? "border-foreground bg-foreground text-background"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Trade {option === "YES" ? "Yes" : "No"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-6 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
            <span>Price</span>
            <span className="text-right">Shares</span>
            <span className="text-right">Total</span>
          </div>

          <BookRows levels={asks} side="ASK" empty="No shares offered." />

          <div className="flex items-baseline justify-between gap-4 border-y border-border bg-muted/40 px-4 py-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground">
            <span>Last {lastPrice === null ? "—" : formatPrice(lastPrice)}</span>
            <span>Spread {spread === null ? "—" : formatPrice(spread)}</span>
          </div>

          <BookRows levels={bids} side="BID" empty="No bids resting." />
        </>
      )}
    </section>
  );
}
