import { TradeSignal } from "../components/Chat/TradeCard";

const TRADE_KEYWORDS = [
  "buy", "sell", "trade", "should i", "sentiment", "trend",
  "analysis", "market", "price", "bullish", "bearish", "invest",
  "hold", "signal", "inj", "btc", "eth", "sol", "crypto",
];

export const isTradeRelated = (text: string): boolean => {
  const lower = text.toLowerCase();
  return TRADE_KEYWORDS.some((kw) => lower.includes(kw));
};

export const fetchTradeSignal = async (
  prompt: string,
  asset?: string
): Promise<TradeSignal | null> => {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, asset: asset || "" }),
    });

    const json = await res.json();

    if (!json.success || !json.data) return null;

    const d = json.data;
    return {
      trend: d.trend,
      asset: d.asset,
      explanation: d.explanation,
      risk: d.risk,
      action: d.action,
      price: d.price,
      change24h: d.change24h,
    } as TradeSignal;
  } catch {
    return null;
  }
};
