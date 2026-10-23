import { MarketView } from "@/features/markets/market-view";

export default async function MarketPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  return <MarketView marketId={marketId} />;
}
