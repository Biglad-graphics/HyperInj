import WebSocket from "ws";
import { handleCandleUpdate } from "../engine/strategyEngine";
import { log } from "../utils/logger";
import type { CandleMessage } from "../types/index";

const WS_URL = "wss://api.hyperliquid.xyz/ws";

export function startHyperliquidFeed() {
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    log("🔗 Connected to Hyperliquid WS");

    const subscriptions = [
      { type: "candle", coin: "BTC", interval: "1m" },
      { type: "candle", coin: "BTC", interval: "5m" },
      { type: "candle", coin: "BTC", interval: "15m" },
      { type: "candle", coin: "BTC", interval: "1h" },
      { type: "candle", coin: "BTC", interval: "4h" },
    ];

    for (const sub of subscriptions) {
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: sub,
        })
      );
    }

    log("📡 Subscribed to BTC candles (1m, 5m, 15m, 1h, 4h)");
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString()) as CandleMessage;
      if (data.channel === "candle") handleCandleUpdate(data.data);
    } catch (err) {
      log("⚠️ WS parse error:", err);
    }
  });

  ws.on("close", () => log("❌ WS Disconnected. Reconnecting..."));
}
