import WebSocket from "ws";
import { handleCandleUpdate } from "../engine/strategyEngine";
import { log } from "../utils/logger";
import type { Candle } from "../types/index";

// Injective mainnet streaming endpoint
const WS_URL = "wss://k8s.mainnet.exchange.grpc-web.injective.network/api/explorer/v1/ws";

// INJ/USDT perpetual market ID on Injective mainnet
const INJ_USDT_PERP = "0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057cbbe3ebee015963";
// BTC/USDT perpetual market ID
const BTC_USDT_PERP = "0x4ca0f92fc28be0c9761326016b5a1a2177dd6375558365116b5bdda9abc229ce";

function toCandle(data: any, symbol: string, interval: string): Candle {
  return {
    t: data.t ?? Date.now(),
    T: data.T ?? Date.now(),
    s: symbol,
    i: interval,
    o: data.o ?? "0",
    c: data.c ?? "0",
    h: data.h ?? "0",
    l: data.l ?? "0",
    v: data.v ?? "0",
    n: data.n ?? 0,
  };
}

export function startInjectiveFeed() {
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    log("Connected to Injective streaming WS");

    // Subscribe to derivative trades for BTC/USDT perp
    const subscribeMsg = {
      type: "subscribe",
      stream: "derivative_trades",
      filter: {
        marketIds: [BTC_USDT_PERP, INJ_USDT_PERP],
      },
    };
    ws.send(JSON.stringify(subscribeMsg));
    log("Subscribed to Injective BTC/USDT and INJ/USDT perpetual trades");
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.type === "derivative_trades" && data.result) {
        for (const trade of data.result.trades ?? []) {
          const symbol = trade.marketId === BTC_USDT_PERP ? "BTC" : "INJ";
          // Synthesise a candle-like structure from the trade
          const candle = toCandle(
            {
              t: trade.executedAt,
              T: trade.executedAt,
              o: trade.executionPrice,
              c: trade.executionPrice,
              h: trade.executionPrice,
              l: trade.executionPrice,
              v: trade.executionQuantity,
              n: 1,
            },
            symbol,
            "1m"
          );
          handleCandleUpdate(candle);
        }
      }
    } catch (err) {
      log("WS parse error:", err);
    }
  });

  ws.on("close", () => {
    log("Injective WS disconnected. Reconnecting in 3s...");
    setTimeout(startInjectiveFeed, 3000);
  });

  ws.on("error", (err) => {
    log("Injective WS error:", err);
  });
}
