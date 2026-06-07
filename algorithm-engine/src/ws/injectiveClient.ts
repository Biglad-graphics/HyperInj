import axios from "axios";
import { handleCandleUpdate } from "../engine/strategyEngine";
import { log } from "../utils/logger";
import type { Candle } from "../types/index";

const INJECTIVE_REST = "https://sentry.mainnet.injective.network:443";
const BTC_USDT_PERP = "0x4ca0f92fc28be0c9761326016b5a1a2177dd6375558365116b5bdda9abc229ce";
const INJ_USDT_PERP = "0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057cbbe3ebee015963";

let lastTradeTime: Record<string, number> = {};

async function fetchRecentTrades(marketId: string, symbol: string) {
  try {
    const res = await axios.get(
      `${INJECTIVE_REST}/api/exchange/derivative/v1beta1/trades`,
      { params: { market_id: marketId, limit: 5 }, timeout: 5000 }
    );
    const trades = res.data?.trades ?? [];
    const last = lastTradeTime[marketId] ?? 0;

    for (const trade of trades) {
      const ts = parseInt(trade.executed_at ?? "0");
      if (ts <= last) continue;

      const candle: Candle = {
        t: ts,
        T: ts,
        s: symbol,
        i: "1m",
        o: parseFloat(trade.execution_price ?? "0"),
        c: parseFloat(trade.execution_price ?? "0"),
        h: parseFloat(trade.execution_price ?? "0"),
        l: parseFloat(trade.execution_price ?? "0"),
        v: parseFloat(trade.execution_quantity ?? "0"),
        n: 1,
      };
      handleCandleUpdate(candle);
    }

    if (trades.length > 0) {
      lastTradeTime[marketId] = parseInt(trades[0].executed_at ?? "0");
    }
  } catch (err) {
    log(`Error fetching ${symbol} trades:`, err);
  }
}

export function startInjectiveFeed() {
  log("Starting Injective trade feed (polling)");

  setInterval(() => fetchRecentTrades(BTC_USDT_PERP, "BTC"), 10000);
  setInterval(() => fetchRecentTrades(INJ_USDT_PERP, "INJ"), 10000);

  // Initial fetch
  fetchRecentTrades(BTC_USDT_PERP, "BTC");
  fetchRecentTrades(INJ_USDT_PERP, "INJ");

  log("Polling Injective BTC/USDT and INJ/USDT perpetual trades every 10s");
}
