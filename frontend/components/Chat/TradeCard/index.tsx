"use client";

import { useState } from "react";
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

const TREND_COLORS = {
  Bullish: "bg-theme-green/10 text-theme-green border-theme-green/30",
  Bearish: "bg-theme-red/10 text-theme-red border-theme-red/30",
  Neutral: "bg-theme-secondary/10 text-theme-secondary border-theme-stroke",
};

const RISK_COLORS = {
  Low: "text-theme-green",
  Medium: "text-theme-yellow",
  High: "text-theme-red",
};

type TradeCardProps = {
  signal: TradeSignal;
};

const TradeCard = ({ signal }: TradeCardProps) => {
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const executeTrade = async (side: "buy" | "sell") => {
    const userId = getUserId();
    if (!userId) {
      setErrorMsg("Not logged in.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      // Look up the spot market ID for this asset
      const markets = await getTopSpotMarkets();
      const market = markets.find(
        (m) => m.baseSymbol.toUpperCase() === signal.asset.toUpperCase()
      );

      if (!market) {
        setErrorMsg(`No Injective market found for ${signal.asset}.`);
        setStatus("error");
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";
      await axios.post(`${apiBase}/injective/order`, {
        userId,
        marketId: market.marketId,
        quantity,
        side,
        orderType: "spot",
      });

      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || err?.message || "Trade failed.");
      setStatus("error");
    }
  };

  const change24hFormatted = signal.change24h >= 0
    ? `+${signal.change24h.toFixed(2)}%`
    : `${signal.change24h.toFixed(2)}%`;
  const changeColor = signal.change24h >= 0 ? "text-theme-green" : "text-theme-red";

  if (status === "success") {
    return (
      <div className="mt-3 rounded-2xl border border-theme-green/30 bg-theme-green/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-theme-green flex items-center justify-center text-white text-sm font-bold">✓</div>
          <div>
            <p className="text-body-1s text-theme-primary">Order placed successfully</p>
            <p className="text-body-2s text-theme-secondary mt-0.5">
              {signal.asset} order submitted to Injective
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-theme-stroke bg-theme-on-surface overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-theme-stroke">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-caption-1m border ${TREND_COLORS[signal.trend]}`}>
            {signal.trend}
          </span>
          <span className="text-title-2s text-theme-primary">{signal.asset}</span>
        </div>
        <div className="text-right">
          {signal.price > 0 && (
            <p className="text-body-1s text-theme-primary">${signal.price.toLocaleString()}</p>
          )}
          {signal.change24h !== 0 && (
            <p className={`text-caption-1m ${changeColor}`}>{change24hFormatted} 24h</p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="px-5 py-3 border-b border-theme-stroke">
        <p className="text-body-2s text-theme-secondary leading-relaxed">{signal.explanation}</p>
        <p className="text-caption-1m text-theme-tertiary mt-2">
          Risk:{" "}
          <span className={`font-semibold ${RISK_COLORS[signal.risk]}`}>{signal.risk}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-body-2s text-theme-secondary shrink-0">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 px-3 py-1.5 bg-theme-n-8 border border-theme-stroke rounded-lg text-body-2s text-theme-primary outline-none focus:border-theme-brand"
          />
          <span className="text-caption-1m text-theme-tertiary">{signal.asset}</span>
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 py-2.5 rounded-xl bg-theme-green text-white text-body-2s font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={() => executeTrade("buy")}
            disabled={status === "loading"}
          >
            {status === "loading" ? "..." : "Buy"}
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl border border-theme-stroke text-theme-secondary text-body-2s font-semibold hover:bg-theme-on-surface-2 transition-colors"
            onClick={() => setStatus("idle")}
            type="button"
          >
            Wait
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl bg-theme-red text-white text-body-2s font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={() => executeTrade("sell")}
            disabled={status === "loading"}
          >
            {status === "loading" ? "..." : "Sell"}
          </button>
        </div>

        {status === "error" && (
          <p className="mt-2 text-caption-1m text-theme-red text-center">{errorMsg}</p>
        )}
      </div>
    </div>
  );
};

export default TradeCard;
