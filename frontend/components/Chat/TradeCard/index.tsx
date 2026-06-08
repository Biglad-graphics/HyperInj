"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getUserId } from "../../../utils/userStorage";
import { getTopSpotMarkets } from "../../../services/injectiveMarkets.service";

export interface TradeSignal {
  trend: "Bullish" | "Bearish" | "Neutral";
  asset: string;
  explanation: string;
  risk: "Low" | "Medium" | "High";
  action: "Buy" | "Wait" | "Sell";
  price: number;
  change24h: number;
}

const TREND_BG: Record<string, string> = {
  Bullish: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Bearish: "bg-red-500/10 text-red-400 border-red-500/20",
  Neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const RISK_COLOR: Record<string, string> = {
  Low: "text-emerald-400",
  Medium: "text-yellow-400",
  High: "text-red-400",
};

type Step = "idle" | "loading" | "success" | "error";

const TradeCard = ({ signal }: { signal: TradeSignal }) => {
  const [quantity, setQuantity] = useState("1");
  const [step, setStep] = useState<Step>("idle");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeSide, setActiveSide] = useState<"buy" | "sell" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const change24hLabel =
    signal.change24h >= 0
      ? `+${signal.change24h.toFixed(2)}%`
      : `${signal.change24h.toFixed(2)}%`;
  const changeColor =
    signal.change24h >= 0 ? "text-emerald-400" : "text-red-400";

  const execute = async (side: "buy" | "sell") => {
    const userId = getUserId();
    if (!userId) {
      setErrorMsg("Not logged in.");
      setStep("error");
      return;
    }
    setActiveSide(side);
    setStep("loading");
    setIsExecuting(true);
    setErrorMsg("");

    try {
      const markets = await getTopSpotMarkets();
      const market = markets.find(
        (m) => m.baseSymbol.toUpperCase() === signal.asset.toUpperCase()
      );
      if (!market) throw new Error(`No Injective market found for ${signal.asset}`);

      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
      await axios.post(`${apiBase}/injective/order`, {
        userId,
        marketId: market.marketId,
        quantity,
        side,
        orderType: "spot",
      });
      setStep("success");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err?.message || "Trade failed.");
      setStep("error");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-3 rounded-2xl border border-white/10 bg-[#111318] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${TREND_BG[signal.trend]}`}
          >
            {signal.trend}
          </span>
          <span className="text-base font-bold text-white">{signal.asset}</span>
        </div>
        <div className="text-right">
          {signal.price > 0 && (
            <p className="text-sm font-semibold text-white">
              ${signal.price.toLocaleString()}
            </p>
          )}
          {signal.change24h !== 0 && (
            <p className={`text-xs ${changeColor}`}>{change24hLabel} 24h</p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="px-5 py-3 border-b border-white/8">
        <p className="text-sm text-zinc-300 leading-relaxed">{signal.explanation}</p>
        <p className="text-xs text-zinc-500 mt-2">
          Risk:{" "}
          <span className={`font-semibold ${RISK_COLOR[signal.risk]}`}>
            {signal.risk}
          </span>
        </p>
      </div>

      {/* Action area */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          {step === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 py-2"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Trade executed successfully
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  +{quantity} {signal.asset} {activeSide === "buy" ? "bought" : "sold"} on Injective
                </p>
              </div>
            </motion.div>
          ) : step === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-2"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <p className="text-sm text-zinc-300">
                Executing {activeSide} order…
              </p>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs text-zinc-500 shrink-0">Qty</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-blue-500 transition-colors"
                />
                <span className="text-xs text-zinc-500">{signal.asset}</span>
              </div>

              <div className="flex gap-2">
                {(["buy", "wait", "sell"] as const).map((action) => (
                  <motion.button
                    key={action}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => action !== "wait" && execute(action)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      action === "buy"
                        ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : action === "sell"
                        ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                        : "border border-white/10 text-zinc-400 hover:bg-white/5"
                    }`}
                    disabled={isExecuting}
                  >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </motion.button>
                ))}
              </div>

              {step === "error" && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-red-400 text-center"
                >
                  {errorMsg}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TradeCard;
