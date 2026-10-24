"use client";

import type { Route } from "next";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { cn } from "@fluke/ui/lib/utils";

import { secondaryAction, textAction } from "@/components/ui/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { StatusTag } from "@/components/ui/status-tag";
import { api } from "@/lib/api";
import { formatDateTime, marketStatusLabel } from "@/lib/format";
import type { MarketStatus, MarketSummary } from "@/lib/types";

const statuses: MarketStatus[] = ["DRAFT", "OPEN", "CLOSED", "RESOLVED", "REFUND"];

export function AdminMarketList({
  status,
  onStatusChange,
  markets,
  loading,
  error,
  onReload,
}: {
  status: MarketStatus;
  onStatusChange: (status: MarketStatus) => void;
  markets: MarketSummary[];
  loading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [resolveChoice, setResolveChoice] = React.useState<Record<string, string>>({});

  const publishMarket = async (market: MarketSummary) => {
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}/publish`, { method: "PATCH" });
      toast.success("Market published.");
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish the market.");
    } finally {
      setBusyId(null);
    }
  };

  const closeMarket = async (market: MarketSummary) => {
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}/close`, { method: "PATCH" });
      toast.success("Market closed.");
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close the market.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMarket = async (market: MarketSummary) => {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}`, { method: "DELETE" });
      toast.success("Draft deleted.");
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the market.");
    } finally {
      setBusyId(null);
    }
  };

  const resolveMarket = async (market: MarketSummary) => {
    const choice = resolveChoice[market.id];
    if (!choice) return;
    if (!window.confirm(choice === "REFUND" ? "Refund every position?" : `Resolve as ${choice}?`)) {
      return;
    }
    setBusyId(market.id);
    try {
      await api(`/markets/${market.id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify(choice === "REFUND" ? { refund: true } : { outcome: choice }),
      });
      toast.success(choice === "REFUND" ? "Market refunded." : `Resolved ${choice}.`);
      setResolveChoice((current) => ({ ...current, [market.id]: "" }));
      await onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve the market.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1">
          {statuses.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onStatusChange(option)}
              aria-pressed={status === option}
              className={
                status === option
                  ? "border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-background"
                  : "border-2 border-transparent px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {marketStatusLabel[option]}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          {loading ? "Reading" : `${markets.length} ${markets.length === 1 ? "market" : "markets"}`}
        </p>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <EmptyState title="Could not read the desk." description={error}>
          <button type="button" onClick={() => void onReload()} className={secondaryAction}>
            Try again
          </button>
        </EmptyState>
      ) : markets.length === 0 ? (
        <EmptyState
          title={`No ${status.toLowerCase()} markets.`}
          description={
            status === "DRAFT"
              ? "Write a question above and keep it as a draft until you are ready."
              : "Nothing is filed under this heading."
          }
        />
      ) : (
        <div className="border-t-2 border-foreground">
          {markets.map((market) => (
            <article
              key={market.id}
              className="flex flex-col gap-4 border-b border-border py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusTag status={market.status} />
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    {market.status === "RESOLVED" && market.outcome
                      ? `Resolved ${market.outcome}`
                      : market.status === "REFUND"
                        ? "Refunded at cost"
                        : `Closes ${formatDateTime(market.closesAt)}`}
                  </span>
                </div>
                <Link
                  href={`/markets/${market.id}` as Route}
                  className="mt-2 line-clamp-2 font-serif text-2xl leading-tight underline-offset-4 hover:text-signal hover:underline"
                >
                  {market.question}
                </Link>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {market.status === "DRAFT" ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === market.id}
                      onClick={() => void publishMarket(market)}
                      className="border border-foreground px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
                    >
                      Publish
                    </button>
                    <button
                      type="button"
                      disabled={busyId === market.id}
                      onClick={() => void deleteMarket(market)}
                      className="px-2 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-destructive disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </>
                ) : null}

                {market.status === "OPEN" ? (
                  <button
                    type="button"
                    disabled={busyId === market.id}
                    onClick={() => void closeMarket(market)}
                    className="border border-foreground px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
                  >
                    Close book
                  </button>
                ) : null}

                {market.status === "OPEN" || market.status === "CLOSED" ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={resolveChoice[market.id] ?? ""}
                      onChange={(event) =>
                        setResolveChoice((current) => ({
                          ...current,
                          [market.id]: event.target.value,
                        }))
                      }
                      className="h-8 border border-border bg-transparent px-2 font-mono text-[10px] tracking-[0.1em]"
                    >
                      <option value="">Outcome…</option>
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                      <option value="REFUND">Refund</option>
                    </select>
                    <button
                      type="button"
                      disabled={busyId === market.id || !resolveChoice[market.id]}
                      onClick={() => void resolveMarket(market)}
                      className={cn(textAction, "disabled:opacity-40")}
                    >
                      Resolve
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
