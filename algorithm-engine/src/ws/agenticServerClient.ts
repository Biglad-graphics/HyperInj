import WebSocket from "ws";
import { log } from "../utils/logger";
import * as dotenv from "dotenv";
dotenv.config();

const WS_URL = process.env["AI_BASE_URL"];

if (!WS_URL) {
  throw new Error("❌ Missing AI_BASE_URL in environment variables");
}

let ws: WebSocket | null = null;

/**
 * Establishes and maintains a persistent WebSocket connection to the AI backend.
 */
export function startAgenticWebSocket() {
  ws = new WebSocket(WS_URL!);

  ws.on("open", () => {
    log(`🤖 Connected to AI WebSocket at ${WS_URL}`);
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      log(`📨 Message from AI:`, data);
    } catch (err) {
      log("⚠️ Error parsing AI WS message:", err);
    }
  });

  ws.on("close", () => {
    log("❌ AI WebSocket disconnected. Reconnecting in 3s...");
    setTimeout(startAgenticWebSocket, 3000);
  });

  ws.on("error", (err) => {
    log("⚠️ AI WebSocket error:", err);
  });
}

/**
 * Sends a message to the AI WebSocket.
 * @param userId - ID of the user in your system
 * @param threadId - AI session or context thread ID
 * @param messageText - Message content to send
 */
export function invokeAgenticServer(userId: string, strategyId: string, timeframe: string, assetSymbol: string, indicatorName: string, direction: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log("⚠️ AI WebSocket not connected, skipping message send.");
    return;
  }

  const payload = {
    user_id: userId,
    thread_id: strategyId,
    message: `analyse ${direction} side of ${assetSymbol} in ${timeframe} interval and take trade if needed`
    
  };

  ws.send(JSON.stringify(payload));
  log(`📤 Sent message to AI →`, payload);
}
