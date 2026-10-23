import { cn } from "@fluke/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { StatusTag } from "@/components/ui/status-tag";
import { formatDate, formatMoney, formatPrice } from "@/lib/format";
import type { Position } from "@/lib/types";

export type PositionTab = "live" | "settled";

function positionResult(position: Position) {
  if (position.status === "REFUND") return "Refunded";
  return position.marketOutcome === position.outcome ? "Won" : "Lost";
}

function ResultText({ result }: { result: string }) {
  return (
    <span
      className={
        result === "Won" ? "text-signal" : result === "Lost" ? "text-muted-foreground" : undefined
      }
    >
      {result}
    </span>
  );
}

function resultClass(result: string) {
  return result === "Won" ? "text-signal" : result === "Lost" ? "text-muted-foreground" : undefined;
}

export function PositionsTable({
  rows,
  tab,
  loading,
  error,
  onRetry,
}: {
  rows: Position[];
  tab: PositionTab;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return <SkeletonRows rows={3} />;
  }

  if (error) {
    return (
      <EmptyState title="Could not read your positions." description={error}>
        <button
          type="button"
          onClick={onRetry}
          className="font-mono text-[11px] uppercase underline"
        >
          Try again
        </button>
      </EmptyState>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={tab === "live" ? "No open positions." : "Nothing settled yet."}
        description={
          tab === "live"
            ? "Buy a side on an open question and it will appear here."
            : "Resolved and refunded positions are filed here."
        }
      >
        {tab === "live" ? (
          <Link href="/markets" className="font-mono text-[11px] uppercase underline">
            Find a question
          </Link>
        ) : null}
      </EmptyState>
    );
  }

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {rows.map((position) => {
          const result = positionResult(position);
          return (
            <article key={position.id} className="border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/markets/${position.marketId}` as Route}
                  className="line-clamp-2 font-serif text-lg leading-tight underline-offset-4 hover:text-signal hover:underline"
                >
                  {position.question}
                </Link>
                <StatusTag status={position.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
                <div>
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                    Side
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px]">
                    {position.outcome} · {position.quantity} shares
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                    Avg price
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px]">{formatPrice(position.avgPrice)}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                    {tab === "live" ? "At cost" : "Result"}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px]">
                    {tab === "live" ? (
                      formatMoney(position.quantity * position.avgPrice)
                    ) : (
                      <ResultText result={result} />
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                    {tab === "live" ? "Payout if right" : "Settled"}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[11px]">
                    {tab === "live"
                      ? formatMoney(position.quantity * 100)
                      : position.settledAt
                        ? formatDate(position.settledAt)
                        : "—"}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto border border-border sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-foreground">
              {[
                "Market",
                "Side",
                "Shares",
                "Avg price",
                tab === "live" ? "At cost" : "Result",
                tab === "live" ? "Payout if right" : "Settled",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-3 py-2 font-mono text-[9px] font-normal tracking-[0.16em] text-muted-foreground uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((position) => {
              const result = positionResult(position);
              return (
                <tr key={position.id} className="border-b border-border last:border-b-0">
                  <td className="max-w-[22rem] px-3 py-3">
                    <Link
                      href={`/markets/${position.marketId}` as Route}
                      className="line-clamp-1 text-sm underline-offset-4 hover:text-signal hover:underline"
                    >
                      {position.question}
                    </Link>
                    <div className="mt-1.5">
                      <StatusTag status={position.status} />
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                    {position.outcome}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                    {position.quantity}
                    {position.reservedQuantity > 0 && !position.settledAt ? (
                      <span className="text-muted-foreground">
                        {" "}
                        ({position.reservedQuantity} held)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                    {formatPrice(position.avgPrice)}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                    {tab === "live" ? (
                      formatMoney(position.quantity * position.avgPrice)
                    ) : (
                      <span className={cn(resultClass(result))}>{result}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] whitespace-nowrap">
                    {tab === "live"
                      ? formatMoney(position.quantity * 100)
                      : position.settledAt
                        ? formatDate(position.settledAt)
                        : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
