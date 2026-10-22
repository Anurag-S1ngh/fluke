"use client";

import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import * as React from "react";

import { EmptyState, PageHeader, SkeletonRows, StatusTag } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { MarketStatus, MarketSummary } from "@/lib/types";
import { useAsync } from "@/lib/use-async";

const tabs: { status: MarketStatus; label: string }[] = [
  { status: "OPEN", label: "Open" },
  { status: "CLOSED", label: "Closed" },
  { status: "RESOLVED", label: "Resolved" },
  { status: "REFUND", label: "Refunded" },
];

export default function MarketsPage() {
  const [status, setStatus] = React.useState<MarketStatus>("OPEN");
  const { data, error, loading, reload } = useAsync(`markets:${status}`, () =>
    api<{ markets: MarketSummary[] }>(`/markets?status=${status}`),
  );
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
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.status}
                type="button"
                onClick={() => setStatus(tab.status)}
                aria-pressed={status === tab.status}
                className={
                  status === tab.status
                    ? "border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-background uppercase"
                    : "border-2 border-transparent px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
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
                className="border border-foreground px-4 py-2 font-mono text-[11px] tracking-[0.16em] uppercase hover:bg-foreground hover:text-background"
              >
                Try again
              </button>
            </EmptyState>
          ) : markets.length === 0 ? (
            <EmptyState
              title={status === "OPEN" ? "No open questions." : "Nothing on this page."}
              description={
                status === "OPEN"
                  ? "The desk is between questions. Resolved markets stay in the archive."
                  : "Nothing has been filed under this heading yet."
              }
            >
              {status !== "OPEN" ? (
                <button
                  type="button"
                  onClick={() => setStatus("OPEN")}
                  className="border border-foreground px-4 py-2 font-mono text-[11px] tracking-[0.16em] uppercase hover:bg-foreground hover:text-background"
                >
                  See open markets
                </button>
              ) : null}
            </EmptyState>
          ) : (
            <div>
              {markets.map((market) => (
                <Link
                  key={market.id}
                  href={`/markets/${market.id}` as Route}
                  className="group block border-b border-border transition-colors hover:bg-muted/40"
                >
                  <article className="grid grid-cols-[1fr_auto] items-center gap-4 py-6 sm:gap-10">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusTag status={market.status} />
                        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                          {market.status === "OPEN" || market.status === "CLOSED"
                            ? `Closes ${formatDate(market.closesAt)}`
                            : `Filed ${formatDate(market.createdAt)}`}
                        </span>
                      </div>
                      <h2 className="mt-3 max-w-3xl font-serif text-2xl leading-tight tracking-[-0.01em] text-balance transition-colors group-hover:text-signal sm:text-3xl">
                        {market.question}
                      </h2>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                      {market.status === "RESOLVED" && market.outcome ? (
                        <div className="text-right">
                          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                            Resolved
                          </p>
                          <p className="font-mono text-lg">{market.outcome}</p>
                        </div>
                      ) : market.status === "REFUND" ? (
                        <div className="text-right">
                          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                            Positions
                          </p>
                          <p className="font-mono text-sm">Refunded</p>
                        </div>
                      ) : null}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-5 text-muted-foreground transition-colors group-hover:text-signal"
                      />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
