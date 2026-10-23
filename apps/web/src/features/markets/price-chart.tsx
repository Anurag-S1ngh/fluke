import { formatDate, formatMoney, formatPrice } from "@/lib/format";
import type { MarketHistoryPoint } from "@/lib/types";

const VIEW_W = 100;
const VIEW_H = 40;

type Plot = {
  line: string;
  area: string;
  min: number;
  max: number;
  ticks: { x: number; label: string }[];
};

function buildPlot(points: MarketHistoryPoint[]): Plot | null {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((point) => point.yes);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const times = points.map((point) => new Date(point.t).getTime());
  const first = times[0] as number;
  const last = times[times.length - 1] as number;
  const duration = last - first;

  const xOf = (index: number) =>
    duration > 0
      ? ((times[index] as number) - first) / duration
      : (index / (points.length - 1 || 1)) * 1;
  const yOf = (value: number) => VIEW_H - ((value - min) / span) * VIEW_H;

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

  return { line, area, min, max, ticks };
}

function gridLines(min: number, max: number) {
  return [25, 50, 75].filter((price) => price > min && price < max);
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
  const plot = buildPlot(points);
  const lastPrice = points.at(-1)?.yes ?? null;
  const span = plot ? plot.max - plot.min || 1 : 1;

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
        ) : plot ? (
          <>
            <div className="pointer-events-none absolute top-6 right-4 flex h-56 flex-col justify-between text-right font-mono text-[10px] text-muted-foreground">
              <span>{formatPrice(plot.max)}</span>
              <span>{formatPrice(plot.min)}</span>
            </div>

            <div className="mr-10 h-56">
              <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                role="img"
                aria-label={`YES price history, ${points.length} trades`}
              >
                {gridLines(plot.min, plot.max).map((price) => {
                  const y = VIEW_H - ((price - plot.min) / span) * VIEW_H;
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
                <circle
                  cx={VIEW_W}
                  cy={VIEW_H - (((lastPrice ?? plot.min) - plot.min) / span) * VIEW_H}
                  r={1.5}
                  className="fill-signal"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
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
              <span>{formatPrice(plot.max - plot.min)} range</span>
            </div>
          </>
        ) : (
          <div className="flex h-56 items-center justify-center border border-dashed border-border">
            <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              No trades yet — be the first to set a price.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
