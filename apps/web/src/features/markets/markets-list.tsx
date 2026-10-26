"use client";

import { cn } from "@fluke/ui/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/footer";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { StatusTag } from "@/components/ui/status-tag";
import { useMarkets } from "@/lib/atoms/resources";
import { formatDate, formatPrice } from "@/lib/format";

export function MarketsList() {
  const { data, error, loading, reload } = useMarkets("OPEN");
  const markets = data?.markets ?? [];

  return (
    <main className="h-full overflow-y-auto">
      <PageHeader
        eyebrow="Markets"
        title="What does the room believe?"
        description="Every question has a price. Read the tape, take a side, and hold your position until the answer arrives."
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
            Open questions
          </p>

          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            {loading
              ? "Reading the tape"
              : `${markets.length} ${markets.length === 1 ? "market" : "markets"}`}
          </p>
        </div>

        <div className="py-8">
          {loading ? (
            <SkeletonRows rows={4} />
          ) : error ? (
            <EmptyState title="The tape is unreadable." description={error}>
              <button
                type="button"
                onClick={() => void reload()}
                className="border border-foreground px-4 py-2 font-mono text-[11px] tracking-[0.16em] hover:bg-foreground hover:text-background"
              >
                Try again
              </button>
            </EmptyState>
          ) : markets.length === 0 ? (
            <EmptyState
              title="No open questions."
              description="The desk is between questions. Check back when the next one is posted."
            />
          ) : (
            <div>
              {markets.map((market) => (
                <Link
                  key={market.id}
                  href={`/markets/${market.id}` as Route}
                  className="group block border-b border-border transition-colors hover:bg-muted/40"
                >
                  <article className="grid grid-cols-[1fr_auto] items-center gap-5 py-6 sm:grid-cols-[1fr_auto_auto] sm:gap-10">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusTag status={market.status} />
                        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                          Closes {formatDate(market.closesAt)}
                        </span>
                      </div>
                      <h2 className="mt-3 max-w-3xl font-serif text-2xl leading-tight tracking-[-0.01em] text-balance transition-colors group-hover:text-signal sm:text-3xl">
                        {market.question}
                      </h2>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          "font-mono text-2xl leading-none tabular-nums sm:text-3xl",
                          market.lastPrice === null && "text-muted-foreground",
                        )}
                      >
                        {market.lastPrice === null ? "—" : formatPrice(market.lastPrice)}
                      </p>
                      <p className="mt-1.5 font-mono text-[9px] tracking-[0.16em] text-muted-foreground">
                        {market.lastPrice === null ? "No trades" : "YES"}
                      </p>
                      {market.lastPrice === null ? null : (
                        <div aria-hidden="true" className="mt-2 ml-auto h-1 w-16 bg-muted">
                          <div
                            className="h-full bg-signal"
                            style={{ width: `max(2px, ${market.lastPrice}%)` }}
                          />
                        </div>
                      )}
                    </div>

                    <ArrowUpRight
                      aria-hidden="true"
                      className="hidden size-5 text-muted-foreground transition-colors group-hover:text-signal sm:block"
                    />
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
