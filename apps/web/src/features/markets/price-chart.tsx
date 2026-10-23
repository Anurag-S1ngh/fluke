import { cn } from "@fluke/ui/lib/utils";

import { formatDate, formatMoney, formatPrice } from "@/lib/format";
import type { MarketHistoryPoint } from "@/lib/types";

const VIEW_W = 100;
const VIEW_H = 40;

function buildPaths(points: MarketHistoryPoint[]) {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((point) => point.yes);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = points.length > 1 ? VIEW_W / (points.length - 1) : VIEW_W;

  const coords = points.map(
    (point, index) =>
      [
        points.length > 1 ? index * step : VIEW_W / 2,
        VIEW_H - ((point.yes - min) / span) * VIEW_H,
      ] as const,
  );

  const line = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const last = coords[coords.length - 1] as readonly [number, number];
  const area = `${line} L${last[0].toFixed(2)},${VIEW_H} L${coords[0]?.[0].toFixed(2)},${VIEW_H} Z`;

  return { line, area, min, max, last };
}

export function PriceChart({
  points,
  loading,
  trades,
  volume,
}: {
  points: MarketHistoryPoint[];
  loading: boolean;
  trades: number;
  volume: number;
}) {
  const chart = buildPaths(points);
  const lastPrice = points.at(-1)?.yes ?? null;
  const firstDate = points[0]?.t;
  const lastDate = points.at(-1)?.t;

  return (
    <section className="border-2 border-foreground">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-foreground px-4 py-3">
        <h2 className="font-mono text-[10px] tracking-[0.18em]">Price history</h2>
        <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          {loading
            ? "Reading"
            : lastPrice === null
              ? "No trades yet"
              : `Last ${formatPrice(lastPrice)}`}
        </p>
      </header>

      <div className="relative px-4 py-6">
        {loading ? (
          <div className="h-56 animate-pulse bg-muted/40" />
        ) : chart ? (
          <>
            <div className="pointer-events-none absolute top-6 right-4 flex h-56 flex-col justify-between text-right font-mono text-[10px] text-muted-foreground">
              <span>{formatPrice(chart.max)}</span>
              <span>{formatPrice(chart.min)}</span>
            </div>

            <div className="mr-10 h-56">
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="none"
                className="h-full w-full"
                role="img"
                aria-label={`YES price history, ${points.length} trades`}
              >
                <path d={chart.area} className="fill-signal/10" />
                <path
                  d={chart.line}
                  fill="none"
                  className="stroke-signal"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-3 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              <span>
                Vol {formatMoney(volume)} · {trades} {trades === 1 ? "trade" : "trades"}
              </span>
              <span>
                {firstDate ? formatDate(firstDate) : "—"}
                {lastDate && lastDate !== firstDate ? ` → ${formatDate(lastDate)}` : ""}
              </span>
            </div>
          </>
        ) : (
          <div
            className={cn(
              "flex h-56 items-center justify-center border border-dashed border-border",
            )}
          >
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              No trades yet — be the first to set a price.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
