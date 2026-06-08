export type Trend = "Bullish" | "Bearish" | "Neutral";
export type Risk = "Low" | "Medium" | "High";
export type Action = "Buy" | "Wait" | "Sell";

export interface TradeDecision {
  asset: string;
  trend: Trend;
  risk: Risk;
  action: Action;
  explanation: string;
  price: number;
  change24h: number;
}

export function computeDecision(
  asset: string,
  price: number,
  change24h: number
): TradeDecision {
  const abs = Math.abs(change24h);

  const trend: Trend =
    change24h > 2 ? "Bullish" : change24h < -2 ? "Bearish" : "Neutral";

  const risk: Risk = abs > 5 ? "High" : abs > 2 ? "Medium" : "Low";

  const action: Action =
    trend === "Bullish" ? "Buy" : trend === "Bearish" ? "Sell" : "Wait";

  const priceStr = price > 0 ? ` at $${price.toLocaleString()}` : "";
  const changeStr =
    change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;

  const explanation =
    trend === "Bullish"
      ? `${asset}${priceStr} is up ${changeStr} in 24h — bullish momentum with ${risk.toLowerCase()} risk. Consider buying with a tight stop-loss.`
      : trend === "Bearish"
      ? `${asset}${priceStr} is down ${changeStr} in 24h — bearish signal with ${risk.toLowerCase()} risk. Wait for a reversal before entering.`
      : `${asset}${priceStr} is moving sideways (${changeStr}) — no clear edge. Hold your position or wait for a breakout.`;

  return { asset, trend, risk, action, explanation, price, change24h };
}
