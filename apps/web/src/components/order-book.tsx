import { formatPrice } from "@/lib/format";
import type { BookLevel, Outcome, Side } from "@/lib/types";

function levelsFor(book: BookLevel[], outcome: Outcome, side: Side) {
  return book
    .filter((level) => level.outcome === outcome && level.side === side)
    .sort((a, b) => (side === "BID" ? b.price - a.price : a.price - b.price))
    .slice(0, 4);
}

function PriceRows({ levels, side, empty }: { levels: BookLevel[]; side: Side; empty: string }) {
  if (levels.length === 0) {
    return (
      <p className="px-4 py-3 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        {empty}
      </p>
    );
  }

  return (
    <div>
      {levels.map((level) => (
        <div
          key={level.price}
          className="flex items-baseline justify-between gap-4 border-b border-border/60 px-4 py-2 last:border-b-0"
        >
          <span
            className={
              side === "BID"
                ? "font-mono text-sm text-signal"
                : "font-mono text-sm text-muted-foreground"
            }
          >
            {formatPrice(level.price)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{level.quantity}</span>
        </div>
      ))}
    </div>
  );
}

function BookSide({ outcome, book }: { outcome: Outcome; book: BookLevel[] }) {
  const asks = levelsFor(book, outcome, "ASK");
  const bids = levelsFor(book, outcome, "BID");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-3">
        <h3 className="font-serif text-2xl leading-none">{outcome}</h3>
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {bids[0] ? `Bid ${formatPrice(bids[0].price)}` : "No bid"}
          <span className="px-1.5">/</span>
          {asks[0] ? `Ask ${formatPrice(asks[0].price)}` : "No ask"}
        </p>
      </div>

      <p className="border-b border-border/60 px-4 pt-3 pb-1 font-mono text-[9px] tracking-[0.16em] text-muted-foreground uppercase">
        Asks
      </p>
      <PriceRows levels={asks} side="ASK" empty="No shares offered." />

      <p className="border-y border-border/60 px-4 pt-3 pb-1 font-mono text-[9px] tracking-[0.16em] text-muted-foreground uppercase">
        Bids
      </p>
      <PriceRows levels={bids} side="BID" empty="No bids resting." />
    </div>
  );
}

export function OrderBook({ book, loading }: { book: BookLevel[]; loading: boolean }) {
  return (
    <section className="border-2 border-foreground">
      <header className="flex items-baseline justify-between gap-4 border-b-2 border-foreground px-4 py-3">
        <h2 className="font-mono text-[10px] tracking-[0.18em] uppercase">Order book</h2>
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {loading ? "Reading" : "Resting orders"}
        </p>
      </header>

      {loading ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="h-64 animate-pulse bg-muted/40" />
          <div className="h-64 animate-pulse bg-muted/40" />
        </div>
      ) : (
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <BookSide outcome="YES" book={book} />
          <BookSide outcome="NO" book={book} />
        </div>
      )}
    </section>
  );
}
