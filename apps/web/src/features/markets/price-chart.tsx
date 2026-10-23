"use client";

import { cn } from "@fluke/ui/lib/utils";
import * as React from "react";

import { formatDate, formatDateTime, formatMoney, formatPrice } from "@/lib/format";
import type { MarketHistoryPoint } from "@/lib/types";

const VIEW_W = 100;
const VIEW_H = 40;

const RANGES = [
  { id: "1H", label: "1H", ms: 60 * 60 * 1000 },
  { id: "6H", label: "6H", ms: 6 * 60 * 60 * 1000 },
  { id: "1D", label: "1D", ms: 24 * 60 * 60 * 1000 },
  { id: "1W", label: "1W", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "1M", label: "1M", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "ALL", label: "All", ms: null },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

type Plot = {
  line: string;
  area: string;
  dataMin: number;
  dataMax: number;
  xs: number[];
  ticks: { x: number; label: string }[];
};

/** The price axis is always the full contract range: $0.00 to $1.00. */
const AXIS_MIN = 0;
const AXIS_MAX = 100;

function windowPoints(points: MarketHistoryPoint[], range: RangeId) {
  const ms = RANGES.find((option) => option.id === range)?.ms ?? null;
  if (ms === null || points.length === 0) return points;

  const end = new Date(points[points.length - 1]?.t as string).getTime();
  return points.filter((point) => new Date(point.t).getTime() >= end - ms);
}

function buildPlot(points: MarketHistoryPoint[]): Plot | null {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((point) => point.yes);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  const times = points.map((point) => new Date(point.t).getTime());
  const first = times[0] as number;
  const last = times[times.length - 1] as number;
  const duration = last - first;

  const xOf = (index: number) =>
    duration > 0 ? ((times[index] as number) - first) / duration : index / (points.length - 1 || 1);
  const yOf = (value: number) => VIEW_H - ((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * VIEW_H;

  const xs = points.map((_, index) => xOf(index));

  // Step path: price holds until the next fill, then jumps.
  let line = `M${(xOf(0) * VIEW_W).toFixed(2)},${yOf(values[0] as number).toFixed(2)}`;
  for (let index = 1; index < points.length; index += 1) {
    const x = (xOf(index) * VIEW_W).toFixed(2);
    const y = yOf(values[index] as number).toFixed(2);
    line += ` H${x} V${y}`;
  }

  const area = `${line} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;

  const midIndex = Math.floor((points.length - 1) / 2);
  const tickIndexes = [...new Set([0, midIndex, points.length - 1])];
  const seen = new Set<string>();
  const ticks: { x: number; label: string }[] = [];
  for (const index of tickIndexes) {
    const at = points[index]?.t;
    if (!at) continue;
    const label = formatDate(at);
    if (seen.has(label)) continue;
    seen.add(label);
    ticks.push({ x: xOf(index) * VIEW_W, label });
  }

  return { line, area, dataMin, dataMax, xs, ticks };
}

function gridLines() {
  return [25, 50, 75];
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
  const [range, setRange] = React.useState<RangeId>("ALL");
  const [hover, setHover] = React.useState<number | null>(null);

  const visible = React.useMemo(() => windowPoints(points, range), [points, range]);
  const plot = React.useMemo(() => buildPlot(visible), [visible]);
  const lastPrice = visible.at(-1)?.yes ?? null;
  const yOfPrice = (value: number) =>
    VIEW_H - ((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * VIEW_H;

  const hovered = hover === null ? null : visible[hover];
  const hoverX = hover === null ? null : (plot?.xs[hover] ?? null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!plot || visible.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));

    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < plot.xs.length; index += 1) {
      const distance = Math.abs((plot.xs[index] as number) - ratio);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    setHover(best);
  };

  return (
    <section className="border-2 border-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-4 py-3">
        <h2 className="font-mono text-[10px] tracking-[0.18em]">Price history</h2>

        <div className="flex flex-wrap items-center gap-1">
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setRange(option.id);
                setHover(null);
              }}
              aria-pressed={range === option.id}
              className={cn(
                "border px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] transition-colors",
                range === option.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative px-4 py-6">
        {loading ? (
          <div className="h-56 animate-pulse bg-muted/40" />
        ) : plot ? (
          <>
            <div className="pointer-events-none absolute top-6 right-4 flex h-56 flex-col justify-between text-right font-mono text-[10px] text-muted-foreground">
              <span>{formatMoney(AXIS_MAX)}</span>
              <span>{formatMoney(50)}</span>
              <span>{formatMoney(AXIS_MIN)}</span>
            </div>

            <div
              className="relative mr-10 h-56 cursor-crosshair"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
            >
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                role="img"
                aria-label={`YES price history, ${visible.length} trades`}
              >
                {gridLines().map((price) => {
                  const y = yOfPrice(price);
                  return (
                    <line
                      key={price}
                      x1={0}
                      x2={VIEW_W}
                      y1={y}
                      y2={y}
                      className="stroke-border"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      strokeDasharray="2 3"
                    />
                  );
                })}
                <path d={plot.area} className="fill-signal/10" />
                <path
                  d={plot.line}
                  fill="none"
                  className="stroke-signal"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {hoverX === null ? (
                  <circle
                    cx={VIEW_W}
                    cy={yOfPrice(lastPrice ?? AXIS_MIN)}
                    r={1.5}
                    className="fill-signal"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : (
                  <>
                    <line
                      x1={hoverX * VIEW_W}
                      x2={hoverX * VIEW_W}
                      y1={0}
                      y2={VIEW_H}
                      className="stroke-foreground/40"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={hoverX * VIEW_W}
                      cy={yOfPrice(hovered?.yes ?? AXIS_MIN)}
                      r={2}
                      className="fill-foreground"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </svg>

              {hovered && hoverX !== null ? (
                <div
                  className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 whitespace-nowrap border border-foreground bg-background px-2 py-1 font-mono text-[10px] leading-snug shadow-sm"
                  style={{ left: `${Math.min(88, Math.max(12, hoverX * 100))}%` }}
                >
                  <span className="block text-muted-foreground">{formatDateTime(hovered.t)}</span>
                  <span className="block">YES {formatPrice(hovered.yes)}</span>
                </div>
              ) : null}
            </div>

            <div className="mr-10 mt-2 flex justify-between gap-2 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
              {plot.ticks.map((tick) => (
                <span key={tick.label}>{tick.label}</span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-t border-border pt-3 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              <span>
                Vol {formatMoney(volume)} · {trades} {trades === 1 ? "trade" : "trades"}
              </span>
              <span>
                Last {lastPrice === null ? "—" : formatPrice(lastPrice)} ·{" "}
                {formatPrice(plot.dataMax - plot.dataMin)} range
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-56 items-center justify-center border border-dashed border-border">
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              {points.length === 0
                ? "No trades yet — be the first to set a price."
                : "No trades in this window."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
