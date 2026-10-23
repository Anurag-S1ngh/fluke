"use client";

import { cn } from "@fluke/ui/lib/utils";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/layout/auth-provider";
import { inputClass, labelClass } from "@/components/ui/actions";
import { Field } from "@/components/ui/field";
import { api } from "@/lib/api";
import { formatMoney, formatPrice } from "@/lib/format";
import type { Market, Order, Outcome, Side } from "@/lib/types";

export type BestPrices = Record<Outcome, { bid: number | null; ask: number | null }>;

const outcomes: Outcome[] = ["YES", "NO"];

export function OrderTicket({
  market,
  best,
  shares,
  onTraded,
}: {
  market: Market;
  best: BestPrices;
  shares: Record<Outcome, number>;
  onTraded: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [outcome, setOutcome] = React.useState<Outcome>("YES");
  const [side, setSide] = React.useState<Side>("BID");
  const [price, setPrice] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (price !== "") return;
    const suggested = (side === "BID" ? best[outcome].ask : best[outcome].bid) ?? 50;
    setPrice(String(suggested));
  }, [best, outcome, price, side]);

  const priceNumber = price === "" ? Number.NaN : Number(price);
  const quantityNumber = quantity === "" ? Number.NaN : Number(quantity);
  const validPrice = Number.isInteger(priceNumber) && priceNumber >= 1 && priceNumber <= 99;
  const validQuantity = Number.isInteger(quantityNumber) && quantityNumber >= 1;
  const total = validPrice && validQuantity ? priceNumber * quantityNumber : 0;
  const payout = validQuantity ? quantityNumber * 100 : 0;
  const availableShares = shares[outcome];
  const affordable =
    side === "BID" ? total <= (user?.balance ?? 0) : quantityNumber <= availableShares;

  const reason =
    market.status !== "OPEN"
      ? "This market is not open for trading."
      : side === "BID" && validQuantity && total > (user?.balance ?? 0)
        ? "Not enough cash for this order."
        : side === "ASK" && validQuantity && quantityNumber > availableShares
          ? "Not enough shares for this order."
          : null;

  const disabled = busy || market.status !== "OPEN" || !validPrice || !validQuantity || !affordable;

  if (market.status !== "OPEN") {
    return (
      <section className="border-2 border-foreground">
        <header className="border-b-2 border-foreground px-4 py-3">
          <h2 className="font-mono text-[10px] tracking-[0.18em]">Trade</h2>
        </header>
        <div className="px-4 py-6">
          <p className="font-serif text-2xl">
            {market.status === "RESOLVED" && market.outcome
              ? `Resolved ${market.outcome}.`
              : market.status === "REFUND"
                ? "Positions refunded."
                : "Trading is closed."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {market.status === "RESOLVED"
              ? "Winning shares paid one dollar each. The book is closed."
              : "Orders are no longer accepted on this question."}
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="border-2 border-foreground">
        <header className="border-b-2 border-foreground px-4 py-3">
          <h2 className="font-mono text-[10px] tracking-[0.18em]">Trade</h2>
        </header>
        <div className="px-4 py-6">
          <p className="font-serif text-2xl">Take a side.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to buy YES or NO on this question.
          </p>
          <Link
            href={`/signin?next=${encodeURIComponent(`/markets/${market.id}`)}`}
            className="mt-5 inline-flex h-10 items-center border-2 border-foreground bg-foreground px-4 font-mono text-[11px] tracking-[0.16em] text-background transition-colors hover:bg-background hover:text-foreground"
          >
            Sign in to trade
          </Link>
        </div>
      </section>
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    setBusy(true);
    setError(null);
    try {
      const { order } = await api<{ order: Order }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          marketId: market.id,
          side,
          outcome,
          price: priceNumber,
          quantity: quantityNumber,
        }),
      });
      toast.success(
        order.status === "FILLED"
          ? "Order filled."
          : order.status === "PARTIALLY_FILLED"
            ? "Order partially filled."
            : "Order placed on the book.",
      );
      setQuantity("");
      await onTraded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-2 border-foreground">
      <header className="flex items-baseline justify-between gap-4 border-b-2 border-foreground px-4 py-3">
        <h2 className="font-mono text-[10px] tracking-[0.18em]">Trade</h2>
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          {formatMoney(user.balance)} available
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          {outcomes.map((option) => {
            const quote = best[option].ask ?? best[option].bid;
            const active = outcome === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setOutcome(option)}
                aria-pressed={active}
                className={cn(
                  "flex items-baseline justify-between gap-2 border-2 px-3 py-2.5 font-mono text-[11px] tracking-[0.1em] transition-colors",
                  active
                    ? option === "YES"
                      ? "border-signal bg-signal text-background"
                      : "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                <span>{option === "YES" ? "Yes" : "No"}</span>
                <span>{quote === null || quote === undefined ? "—" : formatPrice(quote)}</span>
              </button>
            );
          })}
        </div>

        <div>
          <span className={labelClass}>Order</span>
          <div className="mt-2 grid grid-cols-2 border border-foreground">
            {(["BID", "ASK"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSide(option)}
                aria-pressed={side === option}
                className={
                  side === option
                    ? "bg-foreground px-3 py-2 font-mono text-[11px] tracking-[0.16em] text-background"
                    : "px-3 py-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {option === "BID" ? "Buy" : "Sell"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                step={1}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder={best[outcome].ask ? String(best[outcome].ask) : "—"}
                className={`${inputClass} pr-8 font-mono`}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                ¢
              </span>
            </div>
          </Field>

          <Field label="Shares" hint={side === "ASK" ? `${availableShares} held` : undefined}>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>

        <dl className="space-y-2 border-t border-border pt-4 font-mono text-[11px]">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">
              {side === "BID" ? "Max cost" : "Min proceeds"}
            </dt>
            <dd>{formatMoney(total)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">To win</dt>
            <dd>{formatMoney(payout)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{side === "BID" ? "Price" : "Available"}</dt>
            <dd>
              {side === "BID"
                ? validPrice
                  ? formatPrice(priceNumber)
                  : "—"
                : `${availableShares} shares`}
            </dd>
          </div>
        </dl>

        {reason ? (
          <p className="border-l-2 border-destructive pl-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-destructive">
            {reason}
          </p>
        ) : null}

        {error ? (
          <p className="border-l-2 border-destructive pl-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={disabled}
          className="h-11 w-full border-2 border-foreground bg-foreground font-mono text-[11px] tracking-[0.18em] text-background transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          {busy ? "Working…" : `${side === "BID" ? "Buy" : "Sell"} ${outcome}`}
        </button>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Orders cross the spread automatically. Any unfilled quantity rests on the book until
          cancelled.
        </p>
      </form>
    </section>
  );
}
