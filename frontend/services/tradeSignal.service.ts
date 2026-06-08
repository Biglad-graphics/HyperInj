import axios from "axios";
import { TradeSignal } from "../components/Chat/TradeCard";

const AGENTIC_URL =
  process.env.NEXT_PUBLIC_AGENTIC_API_URL || "http://localhost:8000";

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
    const { data } = await axios.post(`${AGENTIC_URL}/trade-signal`, {
      prompt,
      asset: asset || "",
    });
    return data as TradeSignal;
  } catch {
    return null;
  }
};
