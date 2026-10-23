import { formatMoney } from "@/lib/format";

export function PortfolioSummary({
  balance,
  openPositions,
  costBasis,
}: {
  balance: number;
  openPositions: number;
  costBasis: number;
}) {
  const items = [
    { label: "Cash available", value: formatMoney(balance) },
    { label: "Open positions", value: String(openPositions) },
    { label: "At cost", value: formatMoney(costBasis) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px border-2 border-foreground bg-border sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="bg-background p-4">
          <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-2 font-mono text-xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
